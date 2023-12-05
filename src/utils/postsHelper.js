// Helper function to get a post by postId from DynamoDB
const getPostById = async (postId, postsTableName, dynamoDB) => {
  try {
    const dynamoDBParams = {
      TableName: postsTableName,
      Key: { id: postId },
    };

    const result = await dynamoDB.get(dynamoDBParams).promise();
    return result.Item;
  } catch (error) {
    console.error("Error getting post by ID:", error);
    throw error;
  }
};

module.exports = {
  getPostById,
};
