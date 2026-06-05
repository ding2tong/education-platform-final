import { describe, expect, it } from 'vitest'
import { splitMarkdownSlides } from './markdownSlides'

describe('splitMarkdownSlides', () => {
  it('splits slides on markdown separator lines', () => {
    expect(splitMarkdownSlides('# 第一張\n\n---\n\n# 第二張')).toEqual([
      '# 第一張\n\n',
      '\n# 第二張',
    ])
  })

  it('allows trailing whitespace after separator dashes', () => {
    expect(splitMarkdownSlides('A\n---   \nB')).toEqual(['A\n', 'B'])
  })

  it('does not split inline triple dashes inside content', () => {
    expect(splitMarkdownSlides('A --- B')).toEqual(['A --- B'])
  })
})
