import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/app/lib/supabse"; // Assuming this path for your supabase client

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

const AvailableJobs: React.FC = () => {
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null); 
  const [user, setUser] = useState<any>(null); // Store authenticated user

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase.from("jobs").select("*").eq("is_active", true);
        if (error) {
          console.error("Error fetching jobs:", error.message);
        } else {
          setJobListings(data || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchJobs();

    // Fetch current user
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUser(data?.user); // Store the user
      }
    };

    getUser();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedJobId((prevId) => (prevId === id ? null : id)); // Toggle between expanded and collapsed
  };

  const saveJob = async (jobId: string) => {
    if (user) {
      try {
        const { data, error } = await supabase.from("saved_jobs").insert([
          {
            user_id: user.id,
            job_id: jobId,
          },
        ]);

        if (error) {
          console.error("Error saving job:", error.message);
        } else {
          console.log("Job saved successfully:", data);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    } else {
      console.error("User not authenticated");
    }
  };

  // Apply for the job
  const applyForJob = async (jobId: string) => {
    if (user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
        } else {
          const applicantName = profile.full_name;

          // Insert application details into applications table
          const { data, error } = await supabase.from('applications').insert([
            {
              job_id: jobId,
              user_id: user.id,
              applicant_name: applicantName, // Store applicant's name
              status: 'applied', // Set initial status to 'applied'
            },
          ]);

          if (error) {
            console.error("Error applying for job:", error.message);
          } else {
            console.log("Application submitted successfully:", data);
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    } else {
      console.error("User not authenticated");
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

      <View style={styles.buttonGroup}>
        <TouchableOpacity onPress={() => saveJob(item.id)} style={styles.saveButton}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => applyForJob(item.id)} style={styles.applyButton}>
          <Text style={styles.buttonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={jobListings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ flexGrow: 1 }}
      ListEmptyComponent={
        <View style={styles.card}>
          <Text style={styles.title}>No Jobs Available</Text>
          <Text style={styles.subtitle}>Please check back later.</Text>
        </View>
      }
    />
  );
};

export default AvailableJobs;

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
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
