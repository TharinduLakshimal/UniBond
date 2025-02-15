import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/app/lib/supabse";

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  time: string;
  skills: string;
  description: string;
  is_active: boolean;
}

const SavedJobs: React.FC = () => {
  const [savedJobs, setSavedJobs] = useState<JobListing[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null); // Store authenticated user

  useEffect(() => {
    const fetchUserAndSavedJobs = async () => {
      try {
        // Fetch authenticated user
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError.message);
        } else {
          setUser(data?.user);
        }

        // Fetch saved jobs for the authenticated user
        if (data?.user) {
          const { data: savedJobData, error: savedJobError } = await supabase
            .from("saved_jobs")
            .select("job_id")
            .eq("user_id", data?.user.id);

          if (savedJobError) {
            console.error("Error fetching saved jobs:", savedJobError.message);
          } else {
            const jobIds = savedJobData?.map((savedJob) => savedJob.job_id);

            // Fetch job details for the saved job ids
            const { data: jobs, error: jobsError } = await supabase
              .from("jobs")
              .select("*")
              .in("id", jobIds);

            if (jobsError) {
              console.error("Error fetching job details:", jobsError.message);
            } else {
              setSavedJobs(jobs || []);
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchUserAndSavedJobs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedJobId((prevId) => (prevId === id ? null : id)); // Toggle between expanded and collapsed
  };

  const unsaveJob = async (jobId: string) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_jobs")
        .delete()
        .match({ job_id: jobId, user_id: user.id });

      if (error) {
        console.error("Error unsaving job:", error.message);
      } else {
        setSavedJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
        console.log("Deleting saved job with:", { jobId, userId: user.id });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const renderItem = ({ item }: { item: JobListing }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: "https://via.placeholder.com/40" }}
          style={styles.avatar}
        />
        <View style={styles.textGroup}>
          <Text style={styles.name}>{item.company}</Text>
          <Text style={styles.location}>{item.location}</Text>
          <Text style={styles.date}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.details}>
        <View style={styles.row}>
          <Ionicons name="briefcase-outline" size={20} color="gray" />
          <Text style={styles.detailText}>
            {item.type} - {item.level}
          </Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="article" size={20} color="gray" />
          <Text style={styles.detailText}>Skills: {item.skills}</Text>
        </View>
      </View>

      {/* Conditionally render additional fields */}
      {expandedJobId === item.id && (
        <View style={styles.additionalDetails}>
          <Text style={styles.description}>
            <Text style={styles.descriptionTitle}>Description - </Text>
            {item.description}
          </Text>
        </View>
      )}

      {/* Read More / Collapse Button */}
      <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.readMoreButton}>
        <Text style={styles.readMoreText}>
          {expandedJobId === item.id ? "Read Less" : "Read More"}
        </Text>
      </TouchableOpacity>

      {/* Unsave Button */}
      <TouchableOpacity
        onPress={() => unsaveJob(item.id)}
        style={styles.unsaveButton}
      >
        <Text style={styles.unsaveButtonText}>Unsave</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={savedJobs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ flexGrow: 1 }}
      ListEmptyComponent={
        <View style={styles.card}>
          <Text style={styles.title}>No Saved Jobs</Text>
          <Text style={styles.subtitle}>You haven't saved any jobs yet.</Text>
        </View>
      }
    />
  );
};

export default SavedJobs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textGroup: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  location: {
    fontSize: 14,
    color: "gray",
  },
  date: {
    fontSize: 12,
    color: "gray",
  },
  details: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "gray",
  },
  additionalDetails: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: "gray",
  },
  descriptionTitle: {
    fontWeight: "bold",
    color: "black",
  },
  readMoreButton: {
    marginVertical: 8,
    alignSelf: "flex-start",
  },
  readMoreText: {
    fontSize: 14,
    color: "#007BFF",
  },
  unsaveButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  unsaveButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
  },
});
