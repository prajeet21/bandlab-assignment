const uuid = require("uuid");
const awsSdk = require("../config/awsSdk");
const postsHelper = require("../utils/postsHelper");
const dynamoDB = awsSdk.dynamoDB;
const s3 = awsSdk.s3;

// Load .env file configurations
require("dotenv").config();
const postsTableName = process.env.POSTS_TABLE_NAME;
const bucketName = process.env.S3_BUCKET_NAME;

// Controller for creating a post
const createPost = async (req, res) => {
  const postId = uuid.v4();
  const createdAt = new Date().toISOString();
  const { caption, creator } = req.body;

  try {
    // Store the image first in S3 bucket
    const s3Params = {
      Bucket: bucketName,
      Key: `${uuid.v4()}.jpg`,
      Body: req.file.buffer,
      ContentType: "image/jpg",
    };

    const s3Response = await s3.upload(s3Params).promise();

    // Then save the post in DDB
    const post = {
      id: postId,
      caption,
      image: s3Response.Location, // store the S3 image url as the image attribute in post
      creator,
      createdAt,
      comments: [],
    };

    const dynamoDBParams = {
      TableName: postsTableName,
      Item: post,
    };

    await dynamoDB.put(dynamoDBParams).promise();

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating the post:", error);
    res.status(500).json({ error: "Failed to create the post" });
  }
};

// Controller for adding a comment to a post
const addComment = async (req, res) => {
  const postId = req.params.postId;
  const { content, creator } = req.body;

  try {
    // First check if the post exists
    const post = await postsHelper.getPostById(
      postId,
      postsTableName,
      dynamoDB
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = {
      id: uuid.v4(),
      content,
      creator,
      createdAt: new Date().toISOString(),
    };

    // Update the post by appending the comment to the 'comments' attribute
    const dynamoDBParams = {
      TableName: postsTableName,
      Key: { id: postId },
      UpdateExpression:
        "SET #comments = list_append(if_not_exists(#comments, :empty_list), :comment)",
      ExpressionAttributeNames: { "#comments": "comments" },
      ExpressionAttributeValues: { ":comment": [comment], ":empty_list": [] },
      ReturnValues: "ALL_NEW",
    };

    const result = await dynamoDB.update(dynamoDBParams).promise();

    res.status(201).json(result.Attributes.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add the comment" });
  }
};

// Controller for deleting a comment
const deleteComment = async (req, res) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  // First check if the post exists
  try {
    const post = await postsHelper.getPostById(
      postId,
      postsTableName,
      dynamoDB
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Find the index of the comment which needs to be deleted
    const commentIndex = post.comments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Delete the comment and update the post in DDB
    post.comments.splice(commentIndex, 1);

    const params = {
      TableName: postsTableName,
      Key: { id: postId },
      UpdateExpression: "SET comments = :comments",
      ExpressionAttributeValues: {
        ":comments": post.comments,
      },
    };

    await dynamoDB.update(params).promise();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting the comment:", error);
    res.status(500).json({ error: "Failed to deletet the comment" });
  }
};

// Controller for getting posts
const getPosts = async (req, res) => {
  try {
    const pageSize = 3; // Number of posts per page
    const dynamoDBParams = {
      TableName: postsTableName,
      Limit: pageSize,
    };

    /*
    Decoding the 'cursor' query parameter to get the 'ExclusiveStartKey'
    to know the starting point to query in DDB
    */
    if (req.query.cursor) {
      dynamoDBParams.ExclusiveStartKey = JSON.parse(
        Buffer.from(req.query.cursor, "base64").toString("utf-8")
      );
    }

    const result = await dynamoDB.scan(dynamoDBParams).promise();

    const paginatedPosts = result.Items.slice(0, pageSize);

    let nextCursor = null;

    // Check if there are more results
    if (result.LastEvaluatedKey) {
      /*
      Encoding the 'LastEvaluatedKey' for URL safety
      and pass it to the response to fetch the next set of posts
      */
      nextCursor = Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString("base64");
    }

    res.status(200).json({
      posts: paginatedPosts.map((post) => ({
        id: post.id,
        caption: post.caption,
        imageUrl: post.image,
        creator: post.creator,
        createdAt: post.createdAt,
        comments: post.comments.slice(-2),
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ error: "Failed to fetch the posts" });
  }
};

module.exports = {
  createPost,
  addComment,
  deleteComment,
  getPosts,
};
