import Button from "./Button";

interface PostProps {
  imageUrl: string;
  description: string;
}

const Post = ({ imageUrl, description }: PostProps) => {
  const handleAccept = () => {
    // Add accept logic here
    console.log("Post accepted");
  };

  return (
    <div className="post">
      <div className="post-image-container">
        <img src={imageUrl} alt="Post" className="post-image" />
      </div>
      <div className="post-content">
        <p className="post-description">{description}</p>
        <Button onClick={handleAccept} variant="primary">
          Accept
        </Button>
      </div>
    </div>
  );
};

export default Post;
