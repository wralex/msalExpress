import MarkdownIt from 'markdown-it'
import fs from 'fs';
import matter from 'gray-matter';
import mdItHlts from 'markdown-it-highlightjs';
import mdItAttr from 'markdown-it-attrs';
//@ts-ignore
import markdownItIcons from 'markdown-it-icons';
//@ts-ignore
import mdCopyCode from 'markdown-it-code-copy';

import * as myTypes from '../types';

const md: MarkdownIt =
new MarkdownIt()
  .use(mdItHlts, { code: false, inline: true })
  .use(mdItAttr)
  .use(mdCopyCode, {
    iconStyle: 'font-size: 25px; padding: 0; border-width: 0;',
    iconClass: 'fa fa-copy',
    buttonClass: 'btn',
    buttonStyle: 'position: absolute; top: 7.5px; right: 6px; cursor: pointer; outline: none;'
  })
  .use(markdownItIcons, 'emoji')
  .use(markdownItIcons, 'font-awesome');

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