// HomeScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Alert, StyleSheet, FlatList, ActivityIndicator,TouchableOpacity,Image,Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/app/providers/AuthProvider";
import TopNavigationBar from "../../Components/TopNavigationBar";
import { supabase } from "../../../lib/supabse";
import PostItem from "../../screens/PostItem"; // Import the PostItem component


type Post = {
  id: number;
  content: string;
  likes: number;
  comments: { username: string; comment: string }[];
  is_public: boolean;
  user_id: string;
};

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { session } = useAuth();

  const [username, setUsername] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (session) {
      getProfile();
      fetchPosts();
    }
  }, [session]);

  const getProfile = async () => {
    try {
      const profileId = session?.user?.id;
      if (!profileId) throw new Error("No user on the session!");

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", profileId)
        .single();

      if (error) throw error;
      setUsername(data.username || "Anonymous");
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Could not fetch user profile.");
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch all posts, no filtering by user ID
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, likes, comments, is_public, user_id");

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error", "Could not fetch posts.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number, hasLiked: boolean) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) throw new Error("Post not found");
  
      const updatedLikes = hasLiked ? post.likes - 1 : post.likes + 1; // Update likes based on the current like state
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: updatedLikes } : p))
      );
  
      const { error } = await supabase
        .from("posts")
        .update({ likes: updatedLikes })
        .eq("id", postId);
  
      if (error) throw error;
    } catch (error) {
      console.error("Error updating like count:", error);
      Alert.alert("Error", "Could not update the like count.");
      fetchPosts(); // Fetch posts again to update the state correctly
    }
  };
  

  const handleCommentSubmit = async (postId: number, newComment: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) throw new Error("Post not found");

      const updatedComments = [...post.comments, { username, comment: newComment }];
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: updatedComments } : p
        )
      );

      const { error } = await supabase
        .from("posts")
        .update({ comments: updatedComments })
        .eq("id", postId);

      if (error) throw error;
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Could not add the comment.");
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
           <>
      <TopNavigationBar
        userName={username}
        onProfilePress={() => router.push("/screens/ShowProfileEdit")}
        onNotificationPress={() => router.push("/screens/NotificationScreen")}
        onPostPress={() => router.push("/screens/PostScreen")}
      />
   
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            username={username}
            onLike={handleLike}
            onCommentSubmit={handleCommentSubmit}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.postList}
      />

    <TouchableOpacity
          style={styles.DonateButton}
          onPress={() => {
            router.push("/screens/DonationScreen");
          }}
        >
          <Image source={require("../../Constatnts/Donate Icon.png")} />

          <Text style={{ color: "#000", fontWeight: "bold" }}>Donate</Text>

        </TouchableOpacity>
        </>
  );
};

const styles = StyleSheet.create({
  postList: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },  DonateButton: {
    borderWidth: 1,
    borderColor: "#EBF2FA",
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    position: "absolute",
    top: 600, // Consider replacing this with a more responsive positioning like `bottom`.
    right: 20,
    height: 70,
    backgroundColor: "#EBF2FA",
    borderRadius: 100,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Shadow for Android
    elevation: 5,
  },
});

export default HomeScreen;
