import { test } from '@playwright/test';
import fs from 'fs/promises';

const fetchTopicContent = async (page: any) => {
  const contentElement = await page.$('.topic_content');
  const titleElement = await page.$('h1');
  const contentText = (await contentElement?.textContent())?.trim() ?? '无内容';
  const titleText = (await titleElement?.textContent())?.trim() ?? '无标题';
  return { title: titleText, content: contentText };
};

const saveToJsonFile = async (data: any, filePath: string) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('数据已成功保存到', filePath);
  } catch (err) {
    console.error('写入文件时发生错误:', err);
  }
};

test('extract recent topic contents navigating through each page with timeout', async ({ page }, testInfo) => {
  testInfo.setTimeout(60000);
  const topicsContent: Array<{ pageIndex: number; linkIndex: number; title: string; content: string; }> = [];

  for (let currentPage = 1; currentPage <= 2; currentPage++) {
    await page.goto(`https://www.v2ex.com/recent?p=${currentPage}`);
    const topicLinks = page.locator('.topic-link');
    const topicLinkCount = await topicLinks.count();
    console.log('当前页有几个链接', topicLinkCount);

    for (let i = 0; i < topicLinkCount; i++) {
      const link = await topicLinks.nth(i);
      await link.click();
      // { state: 'visible', timeout: 3000 } 这一句是重点
      const contentVisible = await page.waitForSelector('.topic_content', { state: 'visible', timeout: 3000 }).catch(() => false);

      const topicData = contentVisible
        ? await fetchTopicContent(page)
        : { title: "无标题", content: "暂无内容" };

      topicsContent.push({
        pageIndex: currentPage,
        linkIndex: i + 1,
        ...topicData
      });

      await page.goBack();
    }
  }

  console.log("Collected Topic Contents:", topicsContent);
  await saveToJsonFile(topicsContent, './topicsContent.json');
});