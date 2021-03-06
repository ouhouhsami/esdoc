import marked from 'marked';
import escape from 'escape-html';

/**
 * shorten description.
 * e.g. ``this is JavaScript. this is Java.`` => ``this is JavaScript.``.
 *
 * @param {DocObject} doc - target doc object.
 * @param {boolean} [asMarkdown=false] - is true, test as markdown and convert to html.
 * @returns {string} shorten description.
 * @todo shorten before process markdown.
 */
export function shorten(doc, asMarkdown = false) {
  if (!doc) return '';

  if (doc.summary) return doc.summary;

  let desc = doc.descriptionRaw;
  if (!desc) return '';

  let len = desc.length;
  let inSQuote = false;
  let inWQuote = false;
  let inCode = false;
  for (let i = 0; i < desc.length; i++) {
    let char1 = desc.charAt(i);
    let char2 = desc.charAt(i + 1);
    let char4 = desc.substr(i, 6);
    let char5 = desc.substr(i, 7);
    if (char1 === "'") inSQuote = !inSQuote;
    else if (char1 === '"') inWQuote = !inWQuote;
    else if (char4 === '<code>') inCode = true;
    else if (char5 === '</code>') inCode = false;

    if (inSQuote || inCode || inWQuote) continue;

    if (char1 === '.') {
      if (char2 === ' ' || char2 === '\n' || char2 === '<') {
        len = i + 1;
        break;
      }
    } else if (char1 === '\n' && char2 === '\n') {
      len = i + 1;
      break;
    }
  }

  let result = desc.substr(0, len);
  if (asMarkdown) {
    result = markdown(result);
  }

  return result;
}

/**
 * convert markdown text to html.
 * @param {string} text - markdown text.
 * @param {boolean} [breaks=false] if true, break line. FYI gfm is not breaks.
 * @return {string} html.
 */
export function markdown(text, breaks = false) {
  let compiled = marked(text, {
    gfm: true,
    tables: true,
    breaks: breaks,
    sanitize: true,
    sanitizer: (tag) =>{
      if (tag.substr(0, 5) === '<img ') {
        const src = tag.match(/src=['"].*?['"]/);
        const width = tag.match(/width=['"].*?['"]/);
        const height = tag.match(/height=['"].*?['"]/);

        return `<img ${src ? src[0] : ''} ${width ? width[0] : ''} ${height ? height[0] : ''}>`;
      }
      return escape(tag);
    },
    highlight: function (code) {
      //return `<pre class="source-code"><code class="prettyprint">${escape(code)}</code></pre>`;
      return `<code class="source-code prettyprint">${escape(code)}</code>`;
    }
  });

  return compiled;
}

/**
 * get UTC date string.
 * @param {Date} date - target date object.
 * @returns {string} UTC date string(yyyy-mm-dd hh:mm:ss)
 */
export function dateForUTC(date) {
  function pad(num, len) {
    let count = Math.max(0, len - `${num}`.length);
    return '0'.repeat(count) + num;
  }

  let year = date.getUTCFullYear();
  let month = pad(date.getUTCMonth() + 1, 2);
  let day = pad(date.getUTCDay() + 1, 2);
  let hours = pad(date.getUTCHours(), 2);
  let minutes = pad(date.getUTCMinutes(), 2);
  let seconds = pad(date.getUTCSeconds(), 2);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC)`;
}

/**
 * parse ``@example`` value.
 * ``@example`` value can have ``<caption>`` tag.
 *
 * @param {string} example - target example value.
 * @returns {{body: string, caption: string}} parsed example value.
 */
export function parseExample(example) {
  let body = example;
  let caption = '';

  let regexp = new RegExp("^<caption>(.*?)</caption>\n");
  let matched = example.match(regexp);
  if (matched) {
    body = example.replace(regexp, '');
    caption = matched[1].trim();
  }

  return {body, caption};
}
