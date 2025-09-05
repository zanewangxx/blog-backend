const dummy = (_blogs) => 1

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0)
}

const favoriteBlog = (blogs) => {
  if (!Array.isArray(blogs) || blogs.length === 0) return null
  return blogs.reduce((fav, blog) => (fav.likes >= (blog.likes || 0) ? fav : blog))
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
}
