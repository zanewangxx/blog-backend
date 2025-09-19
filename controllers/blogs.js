const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

// GET blogs
blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', {username: 1, name: 1, id: 1})
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
    try{
    const blog = await Blog.findById(request.params.id)
    if(blog){
        response.json(blog)
    }else{
        response.status(404).end()
    }
}catch(error){
    next(error)
}
})

// POST blog
blogsRouter.post('/', userExtractor, async (request, response, next) => {
    try{
        const body = request.body
        const user = request.user
        if (!user) {
            return response.status(400).json({ error: 'userId missing or not valid' })
          }      
        const blog = new Blog({
            title: body.title,
            author: body.author,
            url: body.url,
            likes: body.likes || 0,
            user: user._id
        })
        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()
        response.status(201).json(savedBlog)
    }catch(error){
        next(error)
    }
})

//DELETE blog
blogsRouter.delete('/:id', userExtractor, async (request, response, next) => {
    try{
      const blog = await Blog.findById(request.params.id)
      if(!blog){
        return response.status(404).json({ error: 'no existing'})
      }
      if(blog.user.toString() !== request.user.id.toString()){
        return response.status(403).json({ error: 'only the creator can delete this blog'})
      }
      await blog.deleteOne()
      response.status(204).end()
  }catch(error){
    next(error)
  }
})

//UPDATE blog likes
blogsRouter.put('/:id', async (request, response, next) => {
    try {
      const { likes } = request.body
  
      const updatedBlog = await Blog.findByIdAndUpdate(
        request.params.id,
        { likes },
        { new: true, runValidators: true, context: 'query' }
      )
  
      if (!updatedBlog) {
        return response.status(404).end()
      }
  
      response.json(updatedBlog)
    } catch (error) {
      next(error)
    }
  })
  


module.exports = blogsRouter
