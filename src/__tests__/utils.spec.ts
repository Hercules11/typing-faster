import { beforeEach, describe, expect, it } from 'vitest';

import {
  CUSTOM_CATES_KEY,
  extractWordsFromText,
  getCustomCates,
  loadWordsData,
  matchSourceAndTarget,
  omitBlankLetter,
  regexp,
  removeCustomCate,
  replaceBlankWord,
  saveCustomCate,
  setEndOfContenteditable
} from '@/utils';

describe('matchSourceAndTarget（打字进度拟合匹配）', () => {
  it('输入与目标完全一致时判定为整词匹配完成', () => {
    expect(matchSourceAndTarget('apple', 'apple')).toEqual({
      match: true,
      full: true,
      pos: 5
    });
  });

  it('输入是目标前缀时判定为进行中，pos 指向下一个待输入字符', () => {
    expect(matchSourceAndTarget('app', 'apple')).toEqual({
      match: true,
      full: false,
      pos: 3
    });
  });

  it('空输入视为进行中的匹配，pos 为 0', () => {
    expect(matchSourceAndTarget('', 'apple')).toEqual({
      match: true,
      full: false,
      pos: 0
    });
  });

  it('中间字符输错时判定为不匹配', () => {
    expect(matchSourceAndTarget('apxle', 'apple')).toEqual({
      match: false,
      full: false,
      pos: -1
    });
  });

  it('首字符输错时判定为不匹配', () => {
    expect(matchSourceAndTarget('x', 'apple').match).toBe(false);
  });

  it('输入比目标更长时判定为不匹配（避免把超长输入误判为完成）', () => {
    expect(matchSourceAndTarget('applex', 'apple')).toEqual({
      match: false,
      full: false,
      pos: -1
    });
  });

  it('空目标与空输入判定为整词完成', () => {
    expect(matchSourceAndTarget('', '')).toEqual({
      match: true,
      full: true,
      pos: 0
    });
  });

  it('大小写敏感：小写输入不匹配大写目标', () => {
    expect(matchSourceAndTarget('Apple', 'apple').match).toBe(false);
  });
});

describe('omitBlankLetter（去除输入中的空白字符）', () => {
  it('去除半角空格', () => {
    expect(omitBlankLetter('he llo')).toBe('hello');
  });

  it('去除连续空格', () => {
    expect(omitBlankLetter('he   llo')).toBe('hello');
  });

  it('去除不间断空格（\\u00A0，macOS 输入法常见）', () => {
    expect(omitBlankLetter('he\u00A0llo')).toBe('hello');
  });

  it('去除制表符与换行', () => {
    expect(omitBlankLetter('he\tl\nlo')).toBe('hello');
  });

  it('无空白字符时原样返回', () => {
    expect(omitBlankLetter('hello')).toBe('hello');
    expect(omitBlankLetter('')).toBe('');
  });
});

describe('regexp（空白字符匹配正则）', () => {
  it('能识别各种空白字符', () => {
    expect(regexp.test(' ')).toBe(true);
    expect(regexp.test('\t')).toBe(true);
    expect(regexp.test('\u00A0')).toBe(true);
    expect(regexp.test('\u3000')).toBe(true); // 全角空格
  });

  it('不把普通字符当空白', () => {
    expect(regexp.test('a')).toBe(false);
    expect(regexp.test('')).toBe(false);
  });
});

describe('replaceBlankWord（词内空格转下划线）', () => {
  it('把词中间的空格替换为下划线', () => {
    expect(replaceBlankWord('ice cream')).toBe('ice_cream');
  });

  it('连续多个空格合并为单个下划线', () => {
    expect(replaceBlankWord('a  b   c')).toBe('a_b_c');
  });

  it('首尾空格直接去除，不产生下划线', () => {
    expect(replaceBlankWord(' give up ')).toBe('give_up');
  });

  it('不间断空格（\\u00A0）同样处理', () => {
    expect(replaceBlankWord('a\u00A0\u00A0b')).toBe('a_b');
  });

  it('没有空格时原样返回', () => {
    expect(replaceBlankWord('apple')).toBe('apple');
  });
});

describe('setEndOfContenteditable（光标移到可编辑元素末尾）', () => {
  it('把 selection 折叠到元素内容的末尾', () => {
    const el = document.createElement('div');
    el.contentEditable = 'true';
    el.innerHTML = '<span>abc</span>def';
    document.body.appendChild(el);

    // 先把光标移到开头，再调用工具函数
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(el.firstChild!.firstChild!, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    expect(sel.anchorOffset).toBe(0);

    setEndOfContenteditable(el);
    // collapseToEnd 后光标折叠在容器的所有子节点之后
    expect(sel.isCollapsed).toBe(true);
    expect(sel.anchorNode).toBe(el);
    expect(sel.anchorOffset).toBe(el.childNodes.length);

    el.remove();
  });
});

describe('loadWordsData（词库加载与缓存）', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('无缓存时加载词库 JSON 并写入 localStorage 缓存', async () => {
    const mod = await loadWordsData('junior-high-school');
    // 模块命名空间对象：真实数据挂在 default 上
    expect(mod.default).toBeInstanceOf(Array);
    expect(mod.default.length).toBeGreaterThan(0);
    expect(mod.default[0]).toBeInstanceOf(Array);

    const cached = localStorage.getItem('junior-high-school');
    expect(cached).toBeTruthy();
    expect(JSON.parse(cached!).default[0]).toEqual(mod.default[0]);
  });

  it('命中缓存时直接返回缓存内容，不再读词库文件', async () => {
    const fakeData = { default: [['cached', '缓存词条']] };
    localStorage.setItem('cet-4', JSON.stringify(fakeData));

    const mod = await loadWordsData('cet-4');
    expect(mod.default).toEqual([['cached', '缓存词条']]);
  });

  it('未知分类抛出明确错误，且不写入缓存', async () => {
    await expect(loadWordsData('no-such-category')).rejects.toThrow(/未知的词库分类/);
    expect(localStorage.getItem('no-such-category')).toBeNull();
  });

  it('自定义词库的纯数组缓存归一化为 default 形状', async () => {
    localStorage.setItem('custom-1', JSON.stringify([['apple', '']]));

    const mod = await loadWordsData('custom-1');
    expect(mod.default).toEqual([['apple', '']]);
  });
});

describe('extractWordsFromText（从英文文本提取单词）', () => {
  it('提取单词转为小写，格式与内置词库一致，翻译列用空字符串占位', () => {
    expect(extractWordsFromText('Hello, World! This is a TEST.')).toEqual([
      ['hello', ''],
      ['world', ''],
      ['this', ''],
      ['is', ''],
      ['a', ''],
      ['test', '']
    ]);
  });

  it('大小写去重，保留首次出现的顺序', () => {
    expect(extractWordsFromText('Apple banana APPLE apple')).toEqual([
      ['apple', ''],
      ['banana', '']
    ]);
  });

  it('连字符与撇号保留在同一个单词内', () => {
    expect(extractWordsFromText("A well-known trick isn't hard")).toEqual([
      ['a', ''],
      ['well-known', ''],
      ['trick', ''],
      ["isn't", ''],
      ['hard', '']
    ]);
  });

  it('数字与中文等非英文内容被忽略', () => {
    expect(extractWordsFromText('123 苹果 hello123 456')).toEqual([['hello', '']]);
  });

  it('空文本与无单词文本返回空数组', () => {
    expect(extractWordsFromText('')).toEqual([]);
    expect(extractWordsFromText('你好 123 !!!')).toEqual([]);
  });
});

describe('自定义词库的 localStorage 存取', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveCustomCate 提取单词并写入索引与词库数据', () => {
    const cate = saveCustomCate('  我的词库 ', 'apple banana');
    expect(cate).not.toBeNull();
    expect(cate!.title).toBe('我的词库');
    expect(cate!.value).toMatch(/^custom-[0-9a-z-]+$/);

    // 不足 180 词时自动复制扩充，保证超过单次测试所需数量
    expect(cate!.length).toBeGreaterThan(180);
    expect(cate!.length % 2).toBe(0);

    expect(getCustomCates()).toEqual([cate]);
    const stored = JSON.parse(localStorage.getItem(cate!.value)!);
    expect(stored).toHaveLength(cate!.length);
    expect(stored[0]).toEqual(['apple', '']);
    expect(stored[1]).toEqual(['banana', '']);
  });

  it('单词数已超过 180 时不复制扩充', () => {
    // 生成 200 个互不相同的纯字母单词（提取会剥掉数字，所以不能用 word0 这类）
    const a = 'abcdefghijklmnopqrstuvwxyz';
    const text = Array.from(
      { length: 200 },
      (_, i) => a.charAt(i % 26) + a.charAt(Math.floor(i / 26))
    ).join(' ');
    const cate = saveCustomCate('大词库', text)!;
    expect(cate.length).toBe(200);
    expect(JSON.parse(localStorage.getItem(cate.value)!)).toHaveLength(200);
  });

  it('文本中没有可提取的单词时返回 null 且不写入任何数据', () => {
    expect(saveCustomCate('无效词库', '123 !!! 你好')).toBeNull();
    expect(getCustomCates()).toEqual([]);
  });

  it('多次保存时索引按顺序累积', () => {
    const first = saveCustomCate('first', 'apple')!;
    const second = saveCustomCate('second', 'banana')!;
    expect(getCustomCates().map((item) => item.value)).toEqual([first.value, second.value]);
  });

  it('removeCustomCate 同时移除索引与词库数据', () => {
    const cate = saveCustomCate('to-remove', 'apple')!;
    removeCustomCate(cate.value);

    expect(getCustomCates()).toEqual([]);
    expect(localStorage.getItem(cate.value)).toBeNull();
    expect(localStorage.getItem(CUSTOM_CATES_KEY)).toBe('[]');
  });

  it('removeCustomCate 删除其中一个不影响其余词库', () => {
    const first = saveCustomCate('first', 'apple')!;
    const second = saveCustomCate('second', 'banana')!;
    removeCustomCate(first.value);

    expect(getCustomCates()).toEqual([second]);
    expect(localStorage.getItem(second.value)).not.toBeNull();
  });
});
