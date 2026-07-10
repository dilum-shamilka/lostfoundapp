import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { lostRef } from "@/services/lostService";
import { foundRef } from "@/services/foundService";
import { getDocs, query, orderBy } from "firebase/firestore";
import { Lost } from "@/types/lost";
import { Found } from "@/types/found";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [recentLostItems, setRecentLostItems] = useState<Lost[]>([]);
  const [recentFoundItems, setRecentFoundItems] = useState<Found[]>([]);
  const [userItems, setUserItems] = useState<Array<Lost | Found>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    try {
      const [lostSnapshot, foundSnapshot] = await Promise.all([
        getDocs(query(lostRef, orderBy("createdAt", "desc"))),
        getDocs(query(foundRef, orderBy("createdAt", "desc"))),
      ]);

      const lostItems: Lost[] = lostSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Lost, "id">),
      }));

      const foundItems: Found[] = foundSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Found, "id">),
      }));

      setRecentLostItems(lostItems.filter((i) => i.status === "lost").slice(0, 6));
      setRecentFoundItems(foundItems.filter((i) => i.status === "found").slice(0, 6));

      if (user) {
        const myItems = [...lostItems, ...foundItems].filter(
          (i) => i.userId === user.uid
        );
        setUserItems(myItems.slice(0, 3));
      } else {
        setUserItems([]);
      }
    } catch (err) {
      console.log("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date instanceof Date ? date : date.toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return dateObj.toLocaleDateString();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-darkBg items-center justify-center">
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  const renderItemCard = (item: Lost) => (
    <TouchableOpacity
      key={item.id}
      onPress={() =>
        router.push(
          item.status === "found"
            ? `/(dashboard)/found?view=${item.id}`
            : `/(dashboard)/lost?view=${item.id}`
        )
      }
      className="bg-darkCard border border-darkBorder rounded-2xl p-4 mr-4 w-64 shadow-lg"
    >
      {item.serverImageUrls && item.serverImageUrls.length > 0 && (
        <Image
          source={{ uri: item.serverImageUrls[0] }}
          className="w-full h-40 rounded-xl mb-3 border border-darkBorder"
          resizeMode="cover"
        />
      )}
      <Text className="font-semibold text-cyberText mb-1" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-cyberMuted text-sm mb-2" numberOfLines={2}>
        {item.description}
      </Text>
      {item.location && (
        <View className="flex-row items-center">
          <MaterialIcons name="location-on" size={14} color="#00F0FF" />
          <Text className="text-cyberMuted text-xs ml-1" numberOfLines={1}>
            {item.location}
          </Text>
        </View>
      )}
      <Text className="text-cyberMuted text-xs mt-2">
        {formatDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      className="flex-1 bg-darkBg"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00F0FF" />
      }
    >
      {/* Header */}
      <View className="bg-darkBg px-6 pt-12 pb-6 border-b border-darkBorder">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-3xl font-bold text-cyberCyan">PickMeUp</Text>
            <Text className="text-cyberMuted">Lost & Found Community</Text>
          </View>
          {user && (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="bg-cyberCyan/10 border border-cyberCyan/30 w-12 h-12 rounded-full items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.1)]"
            >
              <MaterialIcons name="person" size={24} color="#00F0FF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Welcome Message */}
        <View className="bg-darkCard border border-darkBorder rounded-2xl p-6 shadow-md">
          <Text className="text-xl font-semibold text-cyberCyan mb-2">
            {user
              ? `Welcome back, ${user.email?.split("@")[0]}!`
              : "Welcome to PickMeUp"}
          </Text>
          <Text className="text-cyberText">
            {user
              ? "Help others find their lost items or report your own."
              : "Sign in to report lost or found items and help others."}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mt-6">
        <Text className="text-xl font-semibold text-cyberText mb-4">
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {/* Browse Lost */}
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/lost")}
            className="bg-darkCard border border-darkBorder rounded-2xl p-5 w-[48%] mb-4 shadow-sm items-center"
          >
            <View className="bg-cyberCyan/10 border border-cyberCyan/20 w-16 h-16 rounded-full items-center justify-center mb-3 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
              <MaterialIcons name="search" size={32} color="#00F0FF" />
            </View>
            <Text className="text-cyberText font-semibold text-center">
              Browse Lost Items
            </Text>
          </TouchableOpacity>

          {/* Report Lost */}
          <TouchableOpacity
            onPress={() => router.push(user ? "/(dashboard)/lost/new" : "/login")}
            className="bg-darkCard border border-darkBorder rounded-2xl p-5 w-[48%] mb-4 shadow-sm items-center"
          >
            <View className="bg-cyberRose/10 border border-cyberRose/20 w-16 h-16 rounded-full items-center justify-center mb-3 shadow-[0_0_10px_rgba(255,0,127,0.1)]">
              <MaterialIcons name="add" size={32} color="#FF007F" />
            </View>
            <Text className="text-cyberText font-semibold text-center">
              Report Lost Item
            </Text>
          </TouchableOpacity>

          {/* Browse Found */}
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/found")}
            className="bg-darkCard border border-darkBorder rounded-2xl p-5 w-[48%] mb-4 shadow-sm items-center"
          >
            <View className="bg-cyberViolet/10 border border-cyberViolet/20 w-16 h-16 rounded-full items-center justify-center mb-3 shadow-[0_0_10px_rgba(217,70,239,0.1)]">
              <MaterialIcons name="inventory" size={32} color="#D946EF" />
            </View>
            <Text className="text-cyberText font-semibold text-center">
              Browse Found Items
            </Text>
          </TouchableOpacity>

          {/* Report Found */}
          <TouchableOpacity
            onPress={() => router.push(user ? "/(dashboard)/found/new" : "/login")}
            className="bg-darkCard border border-darkBorder rounded-2xl p-5 w-[48%] mb-4 shadow-sm items-center"
          >
            <View className="bg-cyberGreen/10 border border-cyberGreen/20 w-16 h-16 rounded-full items-center justify-center mb-3 shadow-[0_0_10px_rgba(0,230,118,0.1)]">
              <MaterialIcons name="add-location-alt" size={32} color="#00E676" />
            </View>
            <Text className="text-cyberText font-semibold text-center">
              Report Found Item
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recently Lost Items */}
      <View className="px-6 mt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-cyberText">
            Recently Lost
          </Text>
          <TouchableOpacity onPress={() => router.push("/(dashboard)/lost")}>
            <Text className="text-cyberCyan font-medium">View All</Text>
          </TouchableOpacity>
        </View>

        {recentLostItems.length === 0 ? (
          <View className="bg-darkCard border border-darkBorder rounded-2xl p-8 items-center">
            <Feather name="package" size={48} color="#8A99AD" />
            <Text className="text-cyberText mt-3 text-center font-medium">
              No lost items reported yet
            </Text>
            <Text className="text-cyberMuted text-center mt-1">
              Be the first to report a lost item
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            {recentLostItems.map(renderItemCard)}
          </ScrollView>
        )}
      </View>

      {/* Recently Found Items */}
      <View className="px-6 mt-6 mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-cyberText">
            Recently Found
          </Text>
          <TouchableOpacity onPress={() => router.push("/(dashboard)/found")}>
            <Text className="text-cyberCyan font-medium">View All</Text>
          </TouchableOpacity>
        </View>

        {recentFoundItems.length === 0 ? (
          <View className="bg-darkCard border border-darkBorder rounded-2xl p-8 items-center">
            <Feather name="inbox" size={48} color="#8A99AD" />
            <Text className="text-cyberText mt-3 text-center font-medium">
              No found items reported yet
            </Text>
            <Text className="text-cyberMuted text-center mt-1">
              Be the first to report a found item
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            {recentFoundItems.map(renderItemCard)}
          </ScrollView>
        )}
      </View>

      {/* User's Items */}
      {user && userItems.length > 0 && (
        <View className="px-6 mt-2 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-cyberText">
              Your Items
            </Text>
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <Text className="text-cyberCyan font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-darkCard border border-darkBorder rounded-2xl p-4 shadow-md">
            {userItems.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center py-3 border-b border-darkBorder last:border-b-0"
              >
                {item.serverImageUrls && item.serverImageUrls.length > 0 && (
                  <Image
                    source={{ uri: item.serverImageUrls[0] }}
                    className="w-16 h-16 rounded-xl mr-4 border border-darkBorder"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-cyberText">
                    {item.title}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View
                      className={`px-2 py-1 rounded-full ${
                        item.status === "found" ? "bg-cyberGreen/10 border border-cyberGreen/30" : "bg-cyberRose/10 border border-cyberRose/30"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          item.status === "found"
                            ? "text-cyberGreen"
                            : "text-cyberRose"
                        }`}
                      >
                        {item.status?.toUpperCase() || "LOST"}
                      </Text>
                    </View>
                    <Text className="text-cyberMuted text-xs ml-2">
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8A99AD" />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Call to Action for non-logged in users */}
      {!user && (
        <View className="px-6 mt-4 mb-8">
          <View className="bg-darkCard border border-darkBorder rounded-2xl p-6 shadow-lg">
            <Text className="text-lg font-semibold text-cyberCyan mb-2">
              Join Our Community
            </Text>
            <Text className="text-cyberText mb-4">
              Sign in to report lost or found items, help others, and get notified when
              your items are found.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              className="bg-cyberCyan px-6 py-3 rounded-xl shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            >
              <Text className="text-darkBg font-bold text-center">
                Sign In / Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default HomeScreen;
