import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Alert } from "@/utils/alert";
import { useAuth } from "@/context/AuthContext";
import { foundRef, deleteFound, updateFound } from "@/services/foundService";
import { lostRef, deleteLost, updateLost} from "@/services/lostService";
import { onSnapshot, query, where } from "firebase/firestore";
import { Lost } from "@/types/lost";
import { Found } from "@/types/found";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";

const ProfileScreen = () => {
  const { user, loading: authLoading, logout, changePassword } = useAuth();
  const router = useRouter();

  const [lostItems, setLostItems] = useState<Lost[]>([]);
  const [foundItems, setFoundItems] = useState<Found[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [markFoundModalVisible, setMarkFoundModalVisible] = useState(false);
  const [markReturnedModalVisible, setMarkReturnedModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Lost | Found | null>(null);
  const [recoveryDetails, setRecoveryDetails] = useState({
    finderName: "",
    contactInfo: "",
    recoveryLocation: "",
    notes: "",
  });
  const [returnDetails, setReturnDetails] = useState({
    ownerName: "",
    contactInfo: "",
    returnLocation: "",
    notes: "",
  });

  // Redirect if user is logged out
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading]);

  // Load user's lost and found items
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    // Query for lost items
    const lostQuery = query(lostRef, where("userId", "==", user.uid));
    const unsubscribeLost = onSnapshot(lostQuery, (snapshot) => {
      const items: Lost[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Lost, "id">),
      }));
      setLostItems(items);
    });

    // Query for found items
    const foundQuery = query(foundRef, where("userId", "==", user.uid));
    const unsubscribeFound = onSnapshot(foundQuery, (snapshot) => {
      const items: Found[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Found, "id">),
      }));
      setFoundItems(items);
      setLoading(false);
    });

    return () => {
      unsubscribeLost();
      unsubscribeFound();
    };
  }, [user]);

  // Logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (err) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  // Delete lost item
  const handleDeleteLost = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingId(id);
            await deleteLost(id);
            Alert.alert("Success", "Item deleted successfully");
          } catch (err) {
            Alert.alert("Error", "Failed to delete item");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  // Delete found item
  const handleDeleteFound = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingId(id);
            await deleteFound(id);
            Alert.alert("Success", "Item deleted successfully");
          } catch (err) {
            Alert.alert("Error", "Failed to delete item");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  // Open mark as found modal
  const openMarkFoundModal = (lost: Lost) => {
    setSelectedItem(lost);
    setRecoveryDetails({
      finderName: "",
      contactInfo: "",
      recoveryLocation: "",
      notes: "",
    });
    setMarkFoundModalVisible(true);
  };

  // Open mark as returned modal
  const openMarkReturnedModal = (found: Found) => {
    setSelectedItem(found);
    setReturnDetails({
      ownerName: "",
      contactInfo: "",
      returnLocation: "",
      notes: "",
    });
    setMarkReturnedModalVisible(true);
  };

  // Mark as found
  const handleMarkFound = async () => {
    if (!selectedItem) return;

    try {
      setUpdatingId(selectedItem.id);
      await updateLost(selectedItem.id, { 
        ...selectedItem, 
        status: "found",
        recoveryDetails 
      });
      Alert.alert("Success", "Item marked as found!");
      setMarkFoundModalVisible(false);
      setSelectedItem(null);
    } catch (err) {
      Alert.alert("Error", "Failed to update item");
    } finally {
      setUpdatingId(null);
    }
  };

  // Mark as returned
  const handleMarkReturned = async () => {
    if (!selectedItem) return;

    try {
      setUpdatingId(selectedItem.id);
      await updateFound(selectedItem.id, { 
        ...selectedItem, 
        status: "returned",
        returnDetails 
      });
      Alert.alert("Success", "Item marked as returned!");
      setMarkReturnedModalVisible(false);
      setSelectedItem(null);
    } catch (err) {
      Alert.alert("Error", "Failed to update item");
    } finally {
      setUpdatingId(null);
    }
  };

  // Edit lost item
  const handleEditLost = (id: string) => {
    router.push(`/(dashboard)/lost/${id}`);
  };

  // Edit found item
  const handleEditFound = (id: string) => {
    router.push(`/(dashboard)/found/${id}`);
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      Alert.alert("Success", "Password changed successfully");
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "Unknown date";
    const dateObj = date instanceof Date ? date : date.toDate();
    return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-darkBg">
        <ActivityIndicator size="large" color="#00F0FF" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-darkBg">

      {/* Header */}
      <View className="bg-darkBg px-6 pt-12 pb-6 border-b border-darkBorder">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-bold text-cyberCyan">Profile</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-cyberRose/10 border border-cyberRose/30 px-4 py-2 rounded-xl"
          >
            <MaterialIcons name="logout" size={20} color="#FF007F" />
            <Text className="text-cyberRose font-semibold ml-2">Log Out</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-darkCard border border-cyberCyan/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(0,240,255,0.05)]">
          <View className="flex-row items-center">
            <View className="bg-cyberCyan/10 border border-cyberCyan/30 w-16 h-16 rounded-full items-center justify-center mr-4 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
              <MaterialIcons name="person" size={32} color="#00F0FF" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-cyberText">Welcome back!</Text>
              <Text className="text-cyberMuted">{user.email}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Security Section */}
      <View className="bg-darkCard border-b border-darkBorder mt-4 px-6 py-4">
        <Text className="text-xl font-semibold text-cyberText mb-4">Account Security</Text>
        <TouchableOpacity
          onPress={() => setPasswordModalVisible(true)}
          className="flex-row items-center justify-between py-3 border-b border-darkBorder"
        >
          <View className="flex-row items-center">
            <MaterialIcons name="lock" size={24} color="#8A99AD" />
            <Text className="ml-4 text-cyberText">Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A99AD" />
        </TouchableOpacity>
      </View>

      {/* My Lost Items */}
      <View className="bg-darkCard border-b border-darkBorder mt-4 px-6 py-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-cyberText">My Lost Items</Text>
          <View className="bg-cyberRose/10 border border-cyberRose/30 px-3 py-1 rounded-full">
            <Text className="text-cyberRose text-sm font-medium">{lostItems.length} items</Text>
          </View>
        </View>

        {loading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#00F0FF" />
            <Text className="text-cyberMuted mt-2">Loading your items...</Text>
          </View>
        ) : lostItems.length === 0 ? (
          <View className="py-8 items-center">
            <Feather name="package" size={48} color="#8A99AD" />
            <Text className="text-cyberMuted mt-2 text-center">
              You haven't reported any lost items yet
            </Text>
          </View>
        ) : (
          lostItems.map((lost) => (
            <View
              key={lost.id}
              className="bg-darkBg border border-darkBorder rounded-2xl p-4 mb-4 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-cyberText flex-1">{lost.title}</Text>
                <View className={`px-3 py-1 rounded-full ${
                  lost.status === "found" ? "bg-cyberGreen/10 border border-cyberGreen/30" : "bg-cyberRose/10 border border-cyberRose/30"
                }`}>
                  <Text className={`text-xs font-medium ${
                    lost.status === "found" ? "text-cyberGreen" : "text-cyberRose"
                  }`}>
                    {lost.status?.toUpperCase() || "LOST"}
                  </Text>
                </View>
              </View>

              <Text className="text-cyberMuted mb-3">{lost.description}</Text>

              {lost.location && (
                <View className="flex-row items-center mb-1">
                  <MaterialIcons name="location-on" size={16} color="#00F0FF" />
                  <Text className="text-cyberMuted text-sm ml-1">{lost.location}</Text>
                </View>
              )}

              {lost.category && (
                <View className="flex-row items-center mb-1">
                  <MaterialIcons name="category" size={16} color="#8A99AD" />
                  <Text className="text-cyberMuted text-sm ml-1">{lost.category}</Text>
                </View>
              )}

              <Text className="text-cyberMuted text-xs mt-2 opacity-60">
                Reported on {formatDate(lost.createdAt)}
              </Text>

              <View className="flex-row justify-between mt-4">
                {lost.status !== "found" && (
                  <TouchableOpacity
                    onPress={() => openMarkFoundModal(lost)}
                    disabled={updatingId === lost.id}
                    className="flex-row items-center bg-cyberGreen/10 border border-cyberGreen/30 px-4 py-2 rounded-xl"
                  >
                    {updatingId === lost.id ? (
                      <ActivityIndicator size="small" color="#00E676" />
                    ) : (
                      <MaterialIcons name="check-circle" size={18} color="#00E676" />
                    )}
                    <Text className="text-cyberGreen font-medium ml-2">Mark Found</Text>
                  </TouchableOpacity>
                )}

                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => handleEditLost(lost.id)}
                    className="bg-cyberCyan/10 border border-cyberCyan/30 p-2 rounded-xl"
                  >
                    <MaterialIcons name="edit" size={18} color="#00F0FF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteLost(lost.id)}
                    disabled={deletingId === lost.id}
                    className="bg-cyberRose/10 border border-cyberRose/30 p-2 rounded-xl"
                  >
                    {deletingId === lost.id ? (
                      <ActivityIndicator size="small" color="#FF007F" />
                    ) : (
                      <MaterialIcons name="delete" size={18} color="#FF007F" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* My Found Items */}
      <View className="bg-darkCard border-b border-darkBorder mt-4 px-6 py-4 mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-cyberText">My Found Items</Text>
          <View className="bg-cyberGreen/10 border border-cyberGreen/30 px-3 py-1 rounded-full">
            <Text className="text-cyberGreen text-sm font-medium">{foundItems.length} items</Text>
          </View>
        </View>

        {loading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#00F0FF" />
          </View>
        ) : foundItems.length === 0 ? (
          <View className="py-8 items-center">
            <Feather name="inbox" size={48} color="#8A99AD" />
            <Text className="text-cyberMuted mt-2 text-center">
              You haven't reported any found items yet
            </Text>
          </View>
        ) : (
          foundItems.map((found) => (
            <View
              key={found.id}
              className="bg-darkBg border border-darkBorder rounded-2xl p-4 mb-4 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-cyberText flex-1">{found.title}</Text>
                <View className={`px-3 py-1 rounded-full ${
                  found.status === "returned" ? "bg-cyberGreen/10 border border-cyberGreen/30" : "bg-cyberCyan/10 border border-cyberCyan/30"
                }`}>
                  <Text className={`text-xs font-medium ${
                    found.status === "returned" ? "text-cyberGreen" : "text-cyberCyan"
                  }`}>
                    {found.status?.toUpperCase() || "FOUND"}
                  </Text>
                </View>
              </View>

              <Text className="text-cyberMuted mb-3">{found.description}</Text>

              {found.location && (
                <View className="flex-row items-center mb-1">
                  <MaterialIcons name="location-on" size={16} color="#00F0FF" />
                  <Text className="text-cyberMuted text-sm ml-1">{found.location}</Text>
                </View>
              )}

              {found.category && (
                <View className="flex-row items-center mb-1">
                  <MaterialIcons name="category" size={16} color="#8A99AD" />
                  <Text className="text-cyberMuted text-sm ml-1">{found.category}</Text>
                </View>
              )}

              <Text className="text-cyberMuted text-xs mt-2 opacity-60">
                Reported on {formatDate(found.createdAt)}
              </Text>

              <View className="flex-row justify-between mt-4">
                {found.status !== "returned" && (
                  <TouchableOpacity
                    onPress={() => openMarkReturnedModal(found)}
                    disabled={updatingId === found.id}
                    className="flex-row items-center bg-cyberGreen/10 border border-cyberGreen/30 px-4 py-2 rounded-xl"
                  >
                    {updatingId === found.id ? (
                      <ActivityIndicator size="small" color="#00E676" />
                    ) : (
                      <MaterialIcons name="check-circle" size={18} color="#00E676" />
                    )}
                    <Text className="text-cyberGreen font-medium ml-2">Mark Returned</Text>
                  </TouchableOpacity>
                )}

                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => handleEditFound(found.id)}
                    className="bg-cyberCyan/10 border border-cyberCyan/30 p-2 rounded-xl"
                  >
                    <MaterialIcons name="edit" size={18} color="#00F0FF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteFound(found.id)}
                    disabled={deletingId === found.id}
                    className="bg-cyberRose/10 border border-cyberRose/30 p-2 rounded-xl"
                  >
                    {deletingId === found.id ? (
                      <ActivityIndicator size="small" color="#FF007F" />
                    ) : (
                      <MaterialIcons name="delete" size={18} color="#FF007F" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-darkCard border border-darkBorder rounded-2xl p-6 w-11/12 max-w-md shadow-[0_0_30px_rgba(0,240,255,0.1)]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-cyberText">Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8A99AD" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Current Password</Text>
              <TextInput
                placeholder="Enter current password"
                placeholderTextColor="#8A99AD"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">New Password</Text>
              <TextInput
                placeholder="Enter new password"
                placeholderTextColor="#8A99AD"
                value={newPassword}
                onChangeText={setNewPassword}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Confirm New Password</Text>
              <TextInput
                placeholder="Confirm new password"
                placeholderTextColor="#8A99AD"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={changingPassword}
              className="bg-cyberCyan p-4 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              {changingPassword ? (
                <ActivityIndicator color="#0B0F19" />
              ) : (
                <Text className="text-darkBg text-center font-bold">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mark as Found Modal */}
      <Modal
        visible={markFoundModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMarkFoundModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-darkCard border border-darkBorder rounded-2xl p-6 w-11/12 max-w-md shadow-[0_0_30px_rgba(0,230,118,0.1)]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-cyberText">Mark Item as Found</Text>
              <TouchableOpacity onPress={() => setMarkFoundModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8A99AD" />
              </TouchableOpacity>
            </View>

            <Text className="text-cyberMuted mb-4">
              Please provide details about how you recovered your item:
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Finder's Name (if applicable)</Text>
              <TextInput
                placeholder="Enter name"
                placeholderTextColor="#8A99AD"
                value={recoveryDetails.finderName}
                onChangeText={(text) => setRecoveryDetails({...recoveryDetails, finderName: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Contact Information</Text>
              <TextInput
                placeholder="Email or phone number"
                placeholderTextColor="#8A99AD"
                value={recoveryDetails.contactInfo}
                onChangeText={(text) => setRecoveryDetails({...recoveryDetails, contactInfo: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Recovery Location</Text>
              <TextInput
                placeholder="Where did you find it?"
                placeholderTextColor="#8A99AD"
                value={recoveryDetails.recoveryLocation}
                onChangeText={(text) => setRecoveryDetails({...recoveryDetails, recoveryLocation: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Additional Notes</Text>
              <TextInput
                placeholder="Any other details about the recovery"
                placeholderTextColor="#8A99AD"
                value={recoveryDetails.notes}
                onChangeText={(text) => setRecoveryDetails({...recoveryDetails, notes: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              onPress={handleMarkFound}
              disabled={updatingId === selectedItem?.id}
              className="bg-cyberGreen p-4 rounded-xl shadow-[0_0_15px_rgba(0,230,118,0.3)]"
            >
              {updatingId === selectedItem?.id ? (
                <ActivityIndicator color="#0B0F19" />
              ) : (
                <Text className="text-darkBg text-center font-bold">Mark as Found</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mark as Returned Modal */}
      <Modal
        visible={markReturnedModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMarkReturnedModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-darkCard border border-darkBorder rounded-2xl p-6 w-11/12 max-w-md shadow-[0_0_30px_rgba(0,230,118,0.1)]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-cyberText">Mark Item as Returned</Text>
              <TouchableOpacity onPress={() => setMarkReturnedModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8A99AD" />
              </TouchableOpacity>
            </View>

            <Text className="text-cyberMuted mb-4">
              Please provide details about how you returned the item:
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Owner's Name</Text>
              <TextInput
                placeholder="Enter owner's name"
                placeholderTextColor="#8A99AD"
                value={returnDetails.ownerName}
                onChangeText={(text) => setReturnDetails({...returnDetails, ownerName: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Contact Information</Text>
              <TextInput
                placeholder="Email or phone number"
                placeholderTextColor="#8A99AD"
                value={returnDetails.contactInfo}
                onChangeText={(text) => setReturnDetails({...returnDetails, contactInfo: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Return Location</Text>
              <TextInput
                placeholder="Where did you return it?"
                placeholderTextColor="#8A99AD"
                value={returnDetails.returnLocation}
                onChangeText={(text) => setReturnDetails({...returnDetails, returnLocation: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Additional Notes</Text>
              <TextInput
                placeholder="Any other details about the return"
                placeholderTextColor="#8A99AD"
                value={returnDetails.notes}
                onChangeText={(text) => setReturnDetails({...returnDetails, notes: text})}
                className="bg-darkBg border border-darkBorder rounded-xl px-4 py-3 text-cyberText"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              onPress={handleMarkReturned}
              disabled={updatingId === selectedItem?.id}
              className="bg-cyberGreen p-4 rounded-xl shadow-[0_0_15px_rgba(0,230,118,0.3)]"
            >
              {updatingId === selectedItem?.id ? (
                <ActivityIndicator color="#0B0F19" />
              ) : (
                <Text className="text-darkBg text-center font-bold">Mark as Returned</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfileScreen;