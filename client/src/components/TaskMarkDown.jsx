import Markdown from 'react-markdown';
import './styles/TaskMarkDown.css';
import { useEffect, useState } from 'react';


// const markdown = `# Main Title: Complete Markdown Guide

// ## Introduction
// Welcome to this comprehensive Markdown guide! Let's explore all the different formatting options.

// ### Text Formatting
// Here's how you can make text **bold**, *italic*, or ***bold and italic***.
// You can also use __underscores__ for _italics_ and ~~strikethrough~~ text.

// ### Links and Images
// Please [Visit OpenAI](https://www.openai.com) for more information.
// ![Placeholder Image](https://www.freecodecamp.org/news/content/images/2023/05/9.png)
// ### Links and Images
// ![Placeholder Image](https://upload.wikimedia.org/wikipedia/commons/4/4c/USASCII_code_chart.svg)
// ### Links and Images
// ![Placeholder Image](https://png.pngtree.com/png-clipart/20230802/original/pngtree-school-crossing-cutout-text-space-road-text-space-vector-picture-image_9299061.png)

// ### Lists
// #### Unordered List:
// * First item
// * Second item
//   * Nested item 1
//   * Nested item 2
//     * Deep nested item
// * Third item

// #### Ordered List:
// 1. First step
// 2. Second step
//    1. Sub-step A
//    2. Sub-step B
// 3. Third step

// ### Code Examples
// this is just a test don't be sad :) code: \`const greeting = "Hello World";\`
// Inline code: \`const greeting = "Hello World";\`
// Inline code: \`const greeting = "Hello World";\`
// Inline code: \`const greeting = "Hello World";\`
// Inline code: \`const greeting = "Hello World";\`

// \`\`\`javascript
// f// Code block with syntax highlighting
// function calculateSum(a, b) {
//   return a + b;
// }

// const result = calculateSum(10, 20);
// console.log(result); // 30
// \`\`\`

// \`\`\`python
// # Python example
// def fibonacci(n):
//     if n <= 1:
//         return n
//     return fibonacci(n-1) + fibonacci(n-2)
// \`\`\`

// ### Blockquotes
// > This is a blockquote
// > It can span multiple lines
// >> And can be nested
// >>> Even deeper nesting

// \n
// > This is a blockquote
// > This is a blockquote
// > This is a blockquote
// > This is a blockquote

// ### Tables
// | Header 1 | Header 2 | Header 3 |
// |----------|----------|----------|
// | Row 1    | Data     | Data     |
// | Row 2    | **Bold** | *Italic* |
// | Row 3    | \`Code\`   | [Link](https://example.com) |

// ### Task Lists
// - [x] Completed task
// - [ ] Pending task
// - [ ] Future task
//   - [x] Subtask 1
//   - [ ] Subtask 2

// ### Horizontal Rule
// Above the line

// ---

// Below the line

// ### Mathematical Expressions
// When $a \\ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are 
// $x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$

// ### Collapsible Section
// <details>
// <summary>Click to expand!</summary>

// #### Hidden Content
// This content is hidden by default but can be revealed by clicking.
// - Hidden list item 1
// - Hidden list item 2
// </details>

// ### Custom HTML
// <div align="center">
//   <h4>Centered content using HTML</h4>
//   <p>Sometimes you need direct HTML for specific formatting</p>
// </div>

// ### Footnotes
// Here's a sentence with a footnote[^1].

// [^1]: This is the footnote content.

// ### Definition List
// Term 1
// : Definition 1

// Term 2
// : Definition 2a
// : Definition 2b

// ### Emoji Support
// :smile: :heart: :thumbsup: :rocket:

// ### Highlighted Text
// ==This text is highlighted== (Note: not supported in all Markdown processors)

// ### Subscript and Superscript
// H~2~O (subscript)
// X^2^ (superscript)

// ---

// *End of Markdown demonstration*`;


export default function TaskMardDown(title) {
  const [Task, setTask] = useState('');

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Pericles001/alx-system_engineering-devops/refs/heads/master/0x14-mysql/README.md')
      .then(r => r.blob())
      .then(blob => blob.text())
      .then(text => setTask(text))
  }, [])
  return <div>
    <header>
      <h1 className='bg-violet-500 text-wrap border-b px-4 py-6 text-2xl text-gray-50 font-bold'>Hello world!</h1>
    </header>
    <main className='task__markdown text-gray-200 p-4'>
      <Markdown>{Task}</Markdown>
    </main>
  </div>
}
