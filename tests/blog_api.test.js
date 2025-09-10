const assert = require('node:assert')
const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})
  
test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs')

  const titles = response.body.map((b) => b.title)
  assert.ok(titles.includes('Test2'))
})

test('a valid blog can be added ', async () => {
    const newBlog = {
        title: "A post test",
        author: "Post",
        url: "www.post.com",
        likes: 6,
    }
  
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  
    const response = await api.get('/api/blogs')
    const contents = response.body.map(r => r.author)
    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)
    assert(contents.includes('Post'))
  })

test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = blogsAtStart[0]
  
    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  
    assert.deepStrictEqual(resultBlog.body, blogToView)
  })

test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
  
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)
  
    const blogsAtEnd = await helper.blogsInDb()
  
    const contents = blogsAtEnd.map(n => n.url)
    assert(!contents.includes(blogToDelete.url))
  
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
  })

  test('updates the likes of a blog', async () => {
    // get the blog from DB
    const blogsAtStart = await Blog.find({})
    const blogToUpdate = blogsAtStart[0]
  
    // send PUT request to update likes
    const updatedLikes = 5
    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send({ likes: updatedLikes })
      .expect(200)
      .expect('Content-Type', /application\/json/)
  
    // check response body
    assert.strictEqual(response.body.likes, updatedLikes)
  
    // double-check database
    const blogInDb = await Blog.findById(blogToUpdate.id)
    assert.strictEqual(blogInDb.likes, updatedLikes)
  })

after(async () => {
  await mongoose.connection.close()
})
