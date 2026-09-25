import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it } from 'vitest';

import CustomWordModal from '@/components/CustomWordModal.vue';
import { CUSTOM_CATES_KEY } from '@/utils';

import { renderWithI18n } from './test-utils';

const openModal = () => renderWithI18n(CustomWordModal, { props: { open: true } });

const getConfirmButton = () => screen.getByRole('button', { name: /添加/ }) as HTMLButtonElement;

describe('CustomWordModal（自定义词库弹窗）', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('打开弹窗渲染标题与文本输入框，初始为加号占位的默认状态', () => {
    openModal();
    expect(screen.getByText('添加自定义词库')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入词库标题（必填）')).toBeInTheDocument();
    expect(document.querySelector('.anticon-plus-circle')).toBeInTheDocument();
    expect(document.querySelector('.icon-valid')).toBeNull();
    expect(document.querySelector('.icon-invalid')).toBeNull();
  });

  it('只填标题不填文本：叉号（红）且确认按钮禁用', async () => {
    openModal();
    const title = screen.getByPlaceholderText('请输入词库标题（必填）');
    await fireEvent.input(title, { target: { value: '我的词库' } });

    expect(document.querySelector('.icon-invalid')).toBeInTheDocument();
    expect(getConfirmButton().disabled).toBe(true);
    expect(screen.getByText('未提取到英文单词，请检查文本内容')).toBeInTheDocument();
  });

  it('标题与文本有效：对勾（绿）、提示提取数量，确认按钮可点击', async () => {
    openModal();
    await fireEvent.input(screen.getByPlaceholderText('请输入词库标题（必填）'), {
      target: { value: '我的词库' }
    });
    await fireEvent.input(screen.getByPlaceholderText(/粘贴或输入纯英文文本/), {
      target: { value: 'Hello, world! Hello apple.' }
    });

    expect(document.querySelector('.icon-valid')).toBeInTheDocument();
    expect(document.querySelector('.icon-invalid')).toBeNull();
    expect(getConfirmButton().disabled).toBe(false);
    expect(screen.getByText('已提取 3 个单词')).toBeInTheDocument();
  });

  it('点击确认后按内置词库格式写入 localStorage，派发 saved 并请求关闭', async () => {
    const { emitted } = openModal();
    await fireEvent.input(screen.getByPlaceholderText('请输入词库标题（必填）'), {
      target: { value: '我的词库' }
    });
    await fireEvent.input(screen.getByPlaceholderText(/粘贴或输入纯英文文本/), {
      target: { value: 'Hello, world! Hello apple.' }
    });
    await fireEvent.click(getConfirmButton());

    await waitFor(() => {
      const cates = JSON.parse(localStorage.getItem(CUSTOM_CATES_KEY)!);
      expect(cates).toHaveLength(1);
      expect(cates[0].title).toBe('我的词库');

      // 3 个单词不足 180，保存时自动复制扩充，前三个保持原顺序
      const stored = JSON.parse(localStorage.getItem(cates[0].value)!);
      expect(stored.length).toBeGreaterThan(180);
      expect(stored.slice(0, 3)).toEqual([
        ['hello', ''],
        ['world', ''],
        ['apple', '']
      ]);
    });
    expect(emitted('saved')).toHaveLength(1);
    expect(emitted('update:open')).toContainEqual([false]);
  });

  it('无效状态下点击确认不写入任何数据', async () => {
    const { emitted } = openModal();
    await fireEvent.input(screen.getByPlaceholderText(/粘贴或输入纯英文文本/), {
      target: { value: '123 !!!' }
    });
    await fireEvent.click(getConfirmButton());

    expect(localStorage.getItem(CUSTOM_CATES_KEY)).toBeNull();
    expect(emitted('saved') ?? []).toHaveLength(0);
  });
});
