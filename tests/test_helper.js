const Blog = require('../models/blog')

const initialBlogs = [
  {
    title: "Test1",
    author: "Zane",
    url: "www.zzz.com",
    likes: 0,
  },
  {
    title: "Test2",
    author: "Zane",
    url: "www.www.com",
    likes: 6,
  }
]

const nonExistingId = async () => {
  const blog = new Blog({ 
    title: 'temp blog',
    author: 'tester',
    url: 'http://temp.com',
    likes: 0,
    })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

module.exports = {
  initialBlogs, nonExistingId, blogsInDb
}