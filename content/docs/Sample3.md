---
title: 'Markdown-it Demo'
---
Table of Contents{.fs-3 .fw-bold}

[[toc]]

---

# Headings (h1)

## h2 Heading  8-)

### h3 Heading

#### h4 Heading

##### h5 Heading

###### h6 Heading

---

# Horizontal Rules

___

---

***

---

# Typographic replacements

Enable typographer option to see result.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,,  -- ---

"Smartypants, double quotes" and 'single quotes'

---

# Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~

---

# Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.

---

# Lists

## Unordered

+ Create a list by starting a line with `+`, `-`, or `*`
+ Sub-lists are made by indenting 2 spaces:
  - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

## Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa

1. You can use sequential numbers...
1. ...or keep all the numbers as `1.`

Start numbering with offset:

57. foo
1. bar

# Task Lists

## Unordered

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
- [X] Task 4
- [ ] Task 5

## Ordered

1. [ ] Task 1
1. [X] Task 2
1. [ ] Task 3
1. [ ] Task 4
1. [ ] Task 5

---

# Code

Inline `code`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code


Block code "fences"

```console
Sample text here...
```

Syntax highlighting

```typescript
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
```

---

# Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

## Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

---

# Links

[link text](http://dev.nodeca.com){target='__blank'}

[link with title](http://nodeca.github.io/pica/demo/ "title text!"){target='__blank'}

Autoconverted link <https://github.com/nodeca/pica>{target='__blank'} (enable linkify to see)

---

# Images

![Minion](https://octodex.github.com/images/minion.png){width=100px height=auto}
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat"){width=100px height=auto}

Like links, Images also have a footnote style syntax

![Alt text][id]{width=100px height=auto}

With a reference later in the document defining the URL location:

[id]: https://octodex.github.com/images/dojocat.jpg  "The Dojocat"

---

# Plugins

The killer feature of `markdown-it` is very effective support of
[syntax plugins](https://www.npmjs.org/browse/keyword/markdown-it-plugin){target='__blank'}.

---

# [Emojies](https://github.com/markdown-it/markdown-it-emoji){target='__blank'}

> Classic markup: :wink: :cry: :laughing: :yum:
>
> Shortcuts (emoticons): :-) :-( 8-) ;)

---

# [Subscript](https://github.com/markdown-it/markdown-it-sub){target='__blank'} / [Superscript](https://github.com/markdown-it/markdown-it-sup){target='__blank'}

- 19^th^
- H~2~O

---

# [Ins](https://github.com/markdown-it/markdown-it-ins){target='__blank'}

++Inserted text++

---

# [Mark](https://github.com/markdown-it/markdown-it-mark){target='__blank'}

==Marked text==


# [Footnotes](https://github.com/markdown-it/markdown-it-footnote){target='__blank'}

Footnote 1 link[^first].

Footnote 2 link[^second].

Inline footnote^[Text of inline footnote] definition.

Duplicated footnote reference[^second].

[^first]: Footnote **can have markup**

    and multiple paragraphs.

[^second]: Footnote text.


# [Definition lists](https://github.com/markdown-it/markdown-it-deflist){target='__blank'}

Term 1

:   Definition 1
with lazy continuation.

Term 2 with *inline markup*

:   Definition 2

        { some code, part of Definition 2 }

    Third paragraph of definition 2.

_Compact style:_

Term 1
  ~ Definition 1

Term 2
  ~ Definition 2a
  ~ Definition 2b


# [Abbreviations](https://github.com/markdown-it/markdown-it-abbr){target='__blank'}

This is HTML abbreviation example.

It converts "HTML", but keep intact partial entries like "xxxHTMLyyy" and so on.

*[HTML]: Hyper Text Markup Language

---

# [Custom containers](https://github.com/markdown-it/markdown-it-container){target='__blank'}

::: warning
*here be dragons*
:::
