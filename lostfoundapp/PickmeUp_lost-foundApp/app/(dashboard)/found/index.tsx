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
import { foundRef, deleteFound } from "@/services/foundService";
import { Alert } from "@/utils/alert";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Found } from "@/types/found";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import { onSnapshot } from "firebase/firestore";

const FoundScreen = () => {
  const [foundItems, setFoundItems] = useState<Found[]>([]);
  const [selectedFound, setSelectedFound] = useState<Found | null>(null);
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
      foundRef,
      (snapshot) => {
        const allFound: Found[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Found, "id">),
        }));
        setFoundItems(allFound);
        setLoading(false);
        hideLoader();
      },
      (err) => {
        console.log("Error listening to found items:", err);
        setLoading(false);
        hideLoader();
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter only items with status "found" + Search + Filter + Sort
  const filteredItems = useMemo(() => {
    let items = foundItems.filter(item => item.status === "found");

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
  }, [foundItems, searchQuery, filterCategory, sortOrder]);

  const handleViewDetails = (found: Found) => {
    setSelectedFound(found);
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
            await deleteFound(id);
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
          <Text className="text-4xl font-bold text-cyberText">Found Items</Text>
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/found/new")}
            className="bg-cyberGreen/10 border border-cyberGreen/30 p-3 rounded-xl shadow-[0_0_10px_rgba(0,230,118,0.2)]"
          >
            <MaterialIcons name="add" size={24} color="#00E676" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-darkCard border border-darkBorder rounded-xl px-4 py-3">
          <MaterialIcons name="search" size={20} color="#8A99AD" />
          <TextInput
            placeholder="Search found items..."
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
                  ? "bg-cyberGreen/20 border-cyberGreen/50"
                  : "bg-darkBg border-darkBorder"
              }`}
            >
              <Text className={`font-medium ${
                filterCategory === cat ? "text-cyberGreen" : "text-cyberMuted"
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
        <View className="bg-cyberGreen/5 px-6 py-2 border-b border-darkBorder">
          <Text className="text-cyberGreen text-sm">
            Filtering by: <Text className="font-semibold">{filterCategory}</Text>
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text className="mt-3 text-cyberMuted">Loading found items...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Feather name="search" size={48} color="#8A99AD" />
          <Text className="text-lg text-cyberMuted mt-4 text-center">
            {searchQuery || filterCategory ? "No matching found items" : "No found items reported yet"}
          </Text>
          <Text className="text-cyberMuted text-center mt-2 opacity-60">
            {searchQuery || filterCategory ? "Try adjusting your search or filters" : "Be the first to report a found item"}
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 py-4">
          {filteredItems.map((found) => (
            <View
              key={found.id}
              className="bg-darkCard rounded-2xl p-4 mb-4 border border-darkBorder shadow-lg"
            >
              {/* Images */}
              {found.serverImageUrls && found.serverImageUrls.length > 0 && (
                <ScrollView 
                  horizontal 
                  className="mb-3"
                  showsHorizontalScrollIndicator={false}
                >
                  {found.serverImageUrls.map((url, index) => (
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
                  {found.title}
                </Text>
                <View className="bg-cyberGreen/10 border border-cyberGreen/30 px-2 py-1 rounded-full ml-2">
                  <Text className="text-cyberGreen text-xs font-semibold">FOUND</Text>
                </View>
              </View>

              <Text className="text-cyberMuted mb-3">{found.description}</Text>

              <View className="space-y-1 mb-3">
                {found.location && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="location-on" size={16} color="#00F0FF" />
                    <Text className="text-cyberMuted text-sm ml-1">{found.location}</Text>
                  </View>
                )}
                
                {found.category && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="category" size={16} color="#8A99AD" />
                    <Text className="text-cyberMuted text-sm ml-1">{found.category}</Text>
                  </View>
                )}
              </View>

              <Text className="text-cyberMuted text-xs mb-3 opacity-60">
                Reported {formatDate(found.createdAt)}
              </Text>

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => handleViewDetails(found)}
                  className="bg-cyberGreen/10 border border-cyberGreen/30 px-4 py-2 rounded-xl flex-row items-center shadow-[0_0_8px_rgba(0,230,118,0.1)]"
                >
                  <MaterialIcons name="visibility" size={16} color="#00E676" />
                  <Text className="text-cyberGreen font-medium text-sm ml-1">View Details</Text>
                </TouchableOpacity>

                {user?.uid === found.userId && (
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => router.push(`/(dashboard)/found/${found.id}`)}
                      className="bg-cyberCyan/10 border border-cyberCyan/30 p-2 rounded-xl"
                    >
                      <MaterialIcons name="edit" size={16} color="#00F0FF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => found.id && handleDelete(found.id)}
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
          <View className="w-full bg-darkCard border border-darkBorder rounded-2xl p-6 max-h-[80%] shadow-[0_0_30px_rgba(0,230,118,0.1)]">
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedFound && (
                <>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-cyberText flex-1">
                      {selectedFound.title}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color="#8A99AD" />
                    </TouchableOpacity>
                  </View>

                  {/* Status Badge */}
                  <View className="bg-cyberGreen/10 border border-cyberGreen/30 px-3 py-1 rounded-full self-start mb-4">
                    <Text className="text-cyberGreen text-sm font-semibold">FOUND ITEM</Text>
                  </View>

                  {/* Images */}
                  {selectedFound.serverImageUrls && selectedFound.serverImageUrls.length > 0 && (
                    <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
                      {selectedFound.serverImageUrls.map((url, index) => (
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
                    {selectedFound.description}
                  </Text>

                  <View className="space-y-3 mb-4">
                    {selectedFound.location && (
                      <View className="flex-row items-start">
                        <MaterialIcons name="location-on" size={20} color="#00F0FF" />
                        <Text className="text-cyberText ml-3 flex-1">{selectedFound.location}</Text>
                      </View>
                    )}

                    {selectedFound.category && (
                      <View className="flex-row items-start">
                        <MaterialIcons name="category" size={20} color="#8A99AD" />
                        <Text className="text-cyberText ml-3 flex-1">{selectedFound.category}</Text>
                      </View>
                    )}

                    {selectedFound.address && (
                      <View className="flex-row items-start">
                        <MaterialIcons name="home" size={20} color="#8A99AD" />
                        <Text className="text-cyberText ml-3 flex-1">{selectedFound.address}</Text>
                      </View>
                    )}

                    {selectedFound.phone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedFound.phone}`)}
                        className="flex-row items-start"
                      >
                        <MaterialIcons name="call" size={20} color="#00E676" />
                        <Text className="text-cyberGreen ml-3 flex-1 underline">{selectedFound.phone}</Text>
                      </TouchableOpacity>
                    )}

                    {selectedFound.email && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`mailto:${selectedFound.email}`)}
                        className="flex-row items-start"
                      >
                        <MaterialIcons name="email" size={20} color="#00E676" />
                        <Text className="text-cyberGreen ml-3 flex-1 underline">{selectedFound.email}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="border-t border-darkBorder pt-3 mb-4">
                    <Text className="text-cyberMuted text-sm">
                      Reported: {formatDate(selectedFound.createdAt)}
                    </Text>
                    <Text className="text-cyberMuted text-sm">
                      Updated: {formatDate(selectedFound.updatedAt)}
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

export default FoundScreen;