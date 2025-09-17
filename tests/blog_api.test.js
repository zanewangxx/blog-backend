const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const helper = require('./test_helper')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')

const api = supertest(app)

let authToken

const loginAndGetToken = async (credentials) => {
  const response = await api.post('/api/login').send(credentials)
  return response.body.token
}

beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})

  const credentials = {username: 'root', password: 'salainen'}
  await api.post('/api/users').send({...credentials, name: 'Superuser'})

  authToken = await loginAndGetToken(credentials)
  const user = await User.findOne({username: credentials.username})

  const blogs = helper.initialBlogs.map((blog) => ({
    ...blog,
    user: user._id
  }))
  const savedBlogs = await Blog.insertMany(blogs)
  user.blogs = savedBlogs.map((blog) => blog._id)
  await user.save()
})

test('blogs are returned as json when authorized', async () => {
  
  await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs').set('Authorization', `Bearer ${authToken}`)
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})
  
test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs').set('Authorization', `Bearer ${authToken}`)
  const titles = response.body.map(b => b.title)
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
      .set('Authorization', `Bearer ${authToken}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  
    const response = await api.get('/api/blogs').set('Authorization', `Bearer ${authToken}`)
    const contents = response.body.map(r => r.author)
    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)
    assert(contents.includes('Post'))
  })

test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = blogsAtStart[0]
  
    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  
    assert.deepStrictEqual(  
    { ...resultBlog.body, user: String(resultBlog.body.user) },
    { ...blogToView, user: String(blogToView.user) })
  })

test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
  
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${authToken}`)
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
      .set('Authorization', `Bearer ${authToken}`)
      .send({ likes: updatedLikes })
      .expect(200)
      .expect('Content-Type', /application\/json/)
  
    // check response body
    assert.strictEqual(response.body.likes, updatedLikes)
  
    // double-check database
    const blogInDb = await Blog.findById(blogToUpdate.id)
    assert.strictEqual(blogInDb.likes, updatedLikes)
  })

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({username: 'root', passwordHash})

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser)
      .expect(201)
      .expect('Content-type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('username must be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

test('adding a blog fails with 401 if token is not provided', async () => {
  const newBlog = {
    title: "Unauthorized Blog",
    author: "Hacker",
    url: "http://hack.com",
    likes: 10,
  }

  await api
    .post('/api/blogs')
    // no Authorization header
    .send(newBlog)
    .expect(401)
    .expect('Content-Type', /application\/json/)

  // double-check nothing was added
  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})


after(async () => {
  await mongoose.connection.close()
})
