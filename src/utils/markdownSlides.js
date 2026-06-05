export const SLIDE_SEPARATOR_REGEX = /^---[ \t]*(?:\r?\n|$)/gm

export const splitMarkdownSlides = (markdownText = '') => {
  return markdownText.split(SLIDE_SEPARATOR_REGEX)
}
