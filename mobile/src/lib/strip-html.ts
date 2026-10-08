// Post.content is stored as rich-text HTML (web renders it via
// dangerouslySetInnerHTML). No HTML renderer is installed on mobile yet, so
// this strips tags down to plain text as a v1 stopgap — swap for
// react-native-render-html if/when proper formatting is worth the weight.
export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
