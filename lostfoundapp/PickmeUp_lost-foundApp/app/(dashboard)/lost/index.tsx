import {
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useEffect, useState, useMemo } from "react";
import { lostRef, deleteLost } from "@/services/lostService";
import { Alert } from "@/utils/alert";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Lost } from "@/types/lost";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import { onSnapshot } from "firebase/firestore";

const LostScreen = () => {
  const [lostItems, setLostItems] = useState<Lost[]>([]);
  const [selectedLost, setSelectedLost] = useState<Lost | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    showLoader();
    const unsubscribe = onSnapshot(
      lostRef,
      (snapshot) => {
        const allLost: Lost[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Lost, "id">),
        }));
        setLostItems(allLost);
        setLoading(false);
        hideLoader();
      },
      (err) => {
        console.log("Error listening to lost items:", err);
        setLoading(false);
        hideLoader();
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter only items with status "lost" + Search + Filter + Sort
  const filteredItems = useMemo(() => {
    let items = lostItems.filter(item => item.status === "lost");

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.location?.toLowerCase().includes(query)
      );
    }

    if (filterCategory) {
      items = items.filter((item) => item.category === filterCategory);
    }

    items.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return items;
  }, [lostItems, searchQuery, filterCategory, sortOrder]);

  const handleViewDetails = (lost: Lost) => {
    setSelectedLost(lost);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            showLoader();
            await deleteLost(id);
            Alert.alert("Success", "Item deleted successfully");
          } catch (err) {
            Alert.alert("Error", "Failed to delete item");
          } finally {
            hideLoader();
          }
        },
      },
    ]);
  };

  const formatDate = (date: any) => {
    if (!date) return "Unknown date";
    const dateObj = date instanceof Date ? date : date.toDate();
    return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View className="flex-1 bg-darkBg">
      {/* Header */}
      <View className="bg-darkBg px-6 pt-12 pb-4 border-b border-darkBorder">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-4xl font-bold text-cyberText">Lost Items</Text>
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/lost/new")}
            className="bg-cyberRose/10 border border-cyberRose/30 p-3 rounded-xl shadow-[0_0_10px_rgba(255,0,127,0.2)]"
          >
            <MaterialIcons name="add" size={24} color="#FF007F" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-darkCard border border-darkBorder rounded-xl px-4 py-3">
          <MaterialIcons name="search" size={20} color="#8A99AD" />
          <TextInput
            placeholder="Search lost items..."
            className="flex-1 ml-2 text-cyberText"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8A99AD"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color="#8A99AD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter + Sort */}
      <View className="bg-darkCard px-6 py-3 border-b border-darkBorder">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          {["Electronics", "Documents", "Jewelry", "Clothing", "Others"].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
              className={`px-4 py-2 mr-2 rounded-full border ${
                filterCategory === cat
                  ? "bg-cyberRose/20 border-cyberRose/50"
                  : "bg-darkBg border-darkBorder"
              }`}
            >
              <Text className={`font-medium ${
                filterCategory === cat ? "text-cyberRose" : "text-cyberMuted"
              }`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            onPress={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="bg-darkBg border border-darkBorder px-4 py-2 mr-2 rounded-full"
          >
            <Text className="text-cyberMuted font-medium">
              Sort: {sortOrder === "newest" ? "Newest" : "Oldest"}
            </Text>
          </TouchableOpacity>

          {(filterCategory || searchQuery) && (
            <TouchableOpacity
              onPress={() => {
                setFilterCategory(null);
                setSearchQuery("");
              }}
              className="bg-cyberRose/10 border border-cyberRose/30 px-4 py-2 rounded-full"
            >
              <Text className="text-cyberRose font-medium">Clear All</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Active filter indicator */}
      {filterCategory && (
        <View className="bg-cyberRose/5 px-6 py-2 border-b border-darkBorder">
          <Text className="text-cyberRose text-sm">
            Filtering by: <Text className="font-semibold">{filterCategory}</Text>
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text className="mt-3 text-cyberMuted">Loading lost items...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Feather name="search" size={48} color="#8A99AD" />
          <Text className="text-lg text-cyberMuted mt-4 text-center">
            {searchQuery || filterCategory ? "No matching lost items found" : "No lost items reported yet"}
          </Text>
          <Text className="text-cyberMuted text-center mt-2 opacity-60">
            {searchQuery || filterCategory ? "Try adjusting your search or filters" : "Be the first to report a lost item"}
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 py-4">
          {filteredItems.map((lost) => (
            <View
              key={lost.id}
              className="bg-darkCard rounded-2xl p-4 mb-4 border border-darkBorder shadow-lg"
            >
              {/* Images */}
              {lost.serverImageUrls && lost.serverImageUrls.length > 0 && (
                <ScrollView 
                  horizontal 
                  className="mb-3"
                  showsHorizontalScrollIndicator={false}
                >
                  {lost.serverImageUrls.map((url, index) => (
                    <Image
                      key={index}
                      source={{ uri: url }}
                      className="w-20 h-20 rounded-xl mr-2 border border-darkBorder"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}

              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-cyberText flex-1">
                  {lost.title}
                </Text>
                <View className="bg-cyberRose/10 border border-cyberRose/30 px-2 py-1 rounded-full ml-2">
                  <Text className="text-cyberRose text-xs font-semibold">LOST</Text>
                </View>
              </View>

              <Text className="text-cyberMuted mb-3">{lost.description}</Text>

              <View className="space-y-1 mb-3">
                {lost.location && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="location-on" size={16} color="#00F0FF" />
                    <Text className="text-cyberMuted text-sm ml-1">{lost.location}</Text>
                  </View>
                )}
                
                {lost.category && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="category" size={16} color="#8A99AD" />
                    <Text className="text-cyberMuted text-sm ml-1">{lost.category}</Text>
                  </View>
                )}
              </View>

              <Text className="text-cyberMuted text-xs mb-3 opacity-60">
                Reported {formatDate(lost.createdAt)}
              </Text>

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => handleViewDetails(lost)}
                  className="bg-cyberCyan/10 border border-cyberCyan/30 px-4 py-2 rounded-xl flex-row items-center shadow-[0_0_8px_rgba(0,240,255,0.1)]"
                >
                  <MaterialIcons name="visibility" size={16} color="#00F0FF" />
                  <Text className="text-cyberCyan font-medium text-sm ml-1">View Details</Text>
                </TouchableOpacity>

                {user?.uid === lost.userId && (
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => router.push(`/(dashboard)/lost/${lost.id}`)}
                      className="bg-cyberCyan/10 border border-cyberCyan/30 p-2 rounded-xl"
                    >
                      <MaterialIcons name="edit" size={16} color="#00F0FF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => lost.id && handleDelete(lost.id)}
                      className="bg-cyberRose/10 border border-cyberRose/30 p-2 rounded-xl"
                    >
                      <MaterialIcons name="delete" size={16} color="#FF007F" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center p-4">
          <View className="w-full bg-darkCard border border-darkBorder rounded-2xl p-6 max-h-[80%] shadow-[0_0_30px_rgba(255,0,127,0.1)]">
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedLost && (
                <>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-cyberText flex-1">
                      {selectedLost.title}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color="#8A99AD" />
                    </TouchableOpacity>
                  </View>

                  {/* Status Badge */}
                  <View className="bg-cyberRose/10 border border-cyberRose/30 px-3 py-1 rounded-full self-start mb-4">
                    <Text className="text-cyberRose text-sm font-semibold">LOST ITEM</Text>
                  </View>

                  {/* Images */}
                  {selectedLost.serverImageUrls && selectedLost.serverImageUrls.length > 0 && (
                    <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
                      {selectedLost.serverImageUrls.map((url, index) => (
                        <Image
                          key={index}
                          source={{ uri: url }}
                          className="w-64 h-64 mr-3 rounded-xl border border-darkBorder"
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}

                  <Text className="text-cyberMuted text-base mb-4 leading-6">
                    {selectedLost.description}
                  </Text>

                  <View className="space-y-3 mb-4">
                    {selectedLost.location && (
                      <View className="flex-row items-start">
                        <MaterialIcons name="location-on" size={20} color="#00F0FF" />
                        <Text className="text-cyberText ml-3 flex-1">{selectedLost.location}</Text>
                      </View>
                    )}

                    {selectedLost.category && (
                      <View className="flex-row items-start">
                        <MaterialIcons name="category" size={20} color="#8A99AD" />
                        <Text className="text-cyberText ml-3 flex-1">{selectedLost.category}</Text>
                      </View>
                    )}

                    {selectedLost.address && (
                      <View className="flex-row items-start">
                        <MaterialIcons name="home" size={20} color="#8A99AD" />
                        <Text className="text-cyberText ml-3 flex-1">{selectedLost.address}</Text>
                      </View>
                    )}

                    {selectedLost.phone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedLost.phone}`)}
                        className="flex-row items-start"
                      >
                        <MaterialIcons name="call" size={20} color="#00F0FF" />
                        <Text className="text-cyberCyan ml-3 flex-1 underline">{selectedLost.phone}</Text>
                      </TouchableOpacity>
                    )}

                    {selectedLost.email && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`mailto:${selectedLost.email}`)}
                        className="flex-row items-start"
                      >
                        <MaterialIcons name="email" size={20} color="#00F0FF" />
                        <Text className="text-cyberCyan ml-3 flex-1 underline">{selectedLost.email}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="border-t border-darkBorder pt-3 mb-4">
                    <Text className="text-cyberMuted text-sm">
                      Reported: {formatDate(selectedLost.createdAt)}
                    </Text>
                    <Text className="text-cyberMuted text-sm">
                      Updated: {formatDate(selectedLost.updatedAt)}
                    </Text>
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-darkBg border border-darkBorder px-6 py-3 rounded-xl mt-2"
              >
                <Text className="text-cyberMuted font-semibold text-center">Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LostScreen;