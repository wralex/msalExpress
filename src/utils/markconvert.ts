import MarkdownIt from 'markdown-it'
import fs from 'fs';
import matter from 'gray-matter';
import * as myTypes from '../types';

import markdownItAnchor from 'markdown-it-anchor';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import {markdownItTable} from 'markdown-it-table';
//@ts-ignore
import markdownItIcons from 'markdown-it-icons';
//@ts-ignore
import markdownItCodeCopy from 'markdown-it-code-copy';
//@ts-ignore
import markdownItTableOfContents from 'markdown-it-table-of-contents';
//@ts-ignore
import markdownItMark from 'markdown-it-mark';
//@ts-ignore
import markdownItTaskLists from 'markdown-it-task-lists';
//@ts-ignore
import markdownItSub from 'markdown-it-sub';
//@ts-ignore
import markdownItSup from 'markdown-it-sup';
//@ts-ignore
import markdownItIns from 'markdown-it-ins';
//@ts-ignore
import markdownItDeflist from 'markdown-it-deflist';
//@ts-ignore
import markdownItAbbr from 'markdown-it-abbr';

const md: MarkdownIt = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(markdownItAttrs)
  .use(markdownItAnchor)
  .use(markdownItFootnote)
  .use(markdownItEmoji)
  .use(markdownItTable)
  .use(markdownItHighlightjs, { code: false, inline: true })
  .use(markdownItTableOfContents, {includeLevel: [1,2,3,4,5,6]})
  .use(markdownItMark)
  .use(markdownItTaskLists)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItIns)
  .use(markdownItDeflist)
  .use(markdownItAbbr)
  .use(markdownItCodeCopy, {iconClass: 'fa fa-copy', buttonClass: 'btn btn-secondary-outline'})
  .use(markdownItIcons, 'emoji')
  .use(markdownItIcons, 'font-awesome');

md.renderer.rules.emoji = (token, idx) => { return `<span>${token[idx].content}</span>`; };

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
  return convertMarkdownToHtml(mtAndMd.content ?? '_(no content found)_');
}

export {
  convertMarkdownToHtml,
  getHtmlFromMdFile,
  getMdMetaAndMd
}