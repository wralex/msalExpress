import MarkdownIt from 'markdown-it'
import fs from 'fs';
import matter from 'gray-matter';
//@ts-ignore
import markdownItIcons from 'markdown-it-icons';
import mdItHlts from 'markdown-it-highlightjs';
import mdItAttr from 'markdown-it-attrs';

import * as myTypes from '../types';

const md: MarkdownIt =
new MarkdownIt()
  .use(mdItHlts, { inline: true })
  .use(mdItAttr);

md.use(markdownItIcons, 'emoji');
md.use(markdownItIcons, 'font-awesome');

function convertMarkdownToHtml(markdown: string): string {
  return md.render(markdown);
}

function getMdMetaAndMd(file: string): myTypes.MetaAndMd {
  const parsedContent = matter(fs.readFileSync(file, 'utf8'));
  return {
    metadata: parsedContent.data,
    content: parsedContent.content
  }
}

function getHtmlFromMdFile(file: string): string {
  const mtAndMd = getMdMetaAndMd(file);
  return convertMarkdownToHtml(mtAndMd.content ?? "_(no content found)_");
}

export {
  convertMarkdownToHtml,
  getHtmlFromMdFile,
  getMdMetaAndMd
}