const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getMongoDb } = require('../config/database');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { title, content = '' } = req.body;
    const db = getMongoDb();

    const document = {
      _id: uuidv4(),
      title,
      content,
      createdBy: req.user.id,
      createdAt: new Date(),
      lastModified: new Date(),
      sharedWith: [],
      version: 1
    };

    await db.collection('documents').insertOne(document);

    res.status(201).json({ message: 'Document created', document });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getMongoDb();
    const document = await db.collection('documents').findOne({ _id: req.params.id });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const isOwner = document.createdBy === req.user.id;
    const isShared = document.sharedWith?.includes(req.user.id);

    if (!isOwner && !isShared) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const db = getMongoDb();

    const updateData = {
      lastModified: new Date(),
      lastModifiedBy: req.user.id
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const result = await db.collection('documents').findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $set: updateData, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    res.json({ message: 'Document updated', document: result.value });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getMongoDb();
    const result = await db.collection('documents').deleteOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

router.post('/:id/share', async (req, res) => {
  try {
    const { userId } = req.body;
    const db = getMongoDb();

    const result = await db.collection('documents').findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $addToSet: { sharedWith: userId } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document shared', document: result.value });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
});

module.exports = router;
