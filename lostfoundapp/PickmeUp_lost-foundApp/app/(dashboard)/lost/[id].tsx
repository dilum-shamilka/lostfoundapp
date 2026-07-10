import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Alert } from "@/utils/alert";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { createLost, deleteLost, getLostById, updateLost } from "@/services/lostService";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import { uploadImagesToCloudinary } from "@/utils/uploadToCloudinary";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";

// Sri Lanka districts
const SRI_LANKA_DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale",
  "Nuwara Eliya", "Galle", "Matara", "Hambantota", "Jaffna",
  "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa",
  "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura",
  "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle",
];

const CATEGORIES = ["Electronics", "Documents", "Clothes", "Pets", "Bags", "Other"];

const LostFormScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id || id === "new";

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const { hideLoader, showLoader } = useLoader();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!isNew && id) {
        try {
          showLoader();
          const lost = await getLostById(id);
          if (lost) {
            setTitle(lost.title);
            setDescription(lost.description);
            setLocation(lost.location ?? "");
            setCategory(lost.category ?? "");
            setPhone(lost.phone ?? "");
            setEmail(lost.email ?? user?.email ?? "");
            setImages(lost.serverImageUrls ?? []);
          }
        } finally {
          hideLoader();
        }
      } else {
        setEmail(user?.email ?? "");
      }
    };
    load();
  }, [id]);

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "title":
        if (!value.trim()) error = "Title is required";
        break;
      case "description":
        if (!value.trim()) error = "Description is required";
        break;
      case "location":
        if (!value) error = "Please select a location";
        break;
      case "category":
        if (!value) error = "Please select a category";
        break;
      case "phone":
        if (!value.trim()) error = "Phone is required";
        else if (!/^\d{10}$/.test(value)) error = "Phone must be 10 digits";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const fields = [
      { name: "title", value: title },
      { name: "description", value: description },
      { name: "location", value: location },
      { name: "category", value: category },
      { name: "phone", value: phone },
      { name: "email", value: email }
    ];
    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field.name, field.value)) isValid = false;
    });
    return isValid;
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit reached", "You can only upload up to 5 images");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const captureImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit reached", "You can only upload up to 5 images");
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access is needed to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      showLoader();
      const localImages = images.filter((img) => !img.startsWith("http"));
      let uploadedUrls: string[] = [];
      if (localImages.length > 0) {
        uploadedUrls = await uploadImagesToCloudinary(localImages);
      }
      const serverImageUrls = [
        ...images.filter((img) => img.startsWith("http")),
        ...uploadedUrls,
      ];
      if (isNew) {
        await createLost({
          title, description, location, category, phone, email,
          serverImageUrls, userId: user?.uid ?? "", status: "lost",
        });
        Alert.alert("Success", "Lost item added successfully!");
      } else {
        await updateLost(id!, {
          title, description, location, category, phone, email, serverImageUrls,
        });
        Alert.alert("Success", "Lost item updated successfully!");
      }
      router.back();
    } catch (err) {
      console.error(`Error ${isNew ? "saving" : "updating"} lost item`, err);
      Alert.alert("Error", `Failed to ${isNew ? "save" : "update"} item`);
    } finally {
      setIsSubmitting(false);
      hideLoader();
    }
  };

  const handleDelete = () => {
    if (isNew || !id) return;
    Alert.alert("Delete Item", "Are you sure you want to delete this lost item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            showLoader();
            await deleteLost(id);
            Alert.alert("Success", "Lost item deleted successfully");
            router.replace("/(dashboard)/lost");
          } catch (err) {
            console.error("Error deleting lost item", err);
            Alert.alert("Error", "Failed to delete item");
          } finally {
            hideLoader();
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-darkBg p-5">
      {/* Page Title */}
      <Text className="text-3xl font-bold text-cyberRose mb-6 text-center">
        {isNew ? "Report Lost Item" : "Edit Lost Item"}
      </Text>

      {/* Title */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-cyberMuted mb-2">Title *</Text>
        <TextInput
          placeholder="Enter item title"
          placeholderTextColor="#8A99AD"
          className={`border p-4 rounded-xl bg-darkCard text-cyberText ${errors.title ? "border-cyberRose" : "border-darkBorder"}`}
          value={title}
          onChangeText={(text) => { setTitle(text); validateField("title", text); }}
          onBlur={() => validateField("title", title)}
        />
        {errors.title && <Text className="text-cyberRose text-xs mt-1">{errors.title}</Text>}
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-cyberMuted mb-2">Description *</Text>
        <TextInput
          placeholder="Describe the item in detail"
          placeholderTextColor="#8A99AD"
          multiline
          numberOfLines={4}
          className={`border p-4 rounded-xl bg-darkCard text-cyberText min-h-24 ${errors.description ? "border-cyberRose" : "border-darkBorder"}`}
          value={description}
          onChangeText={(text) => { setDescription(text); validateField("description", text); }}
          onBlur={() => validateField("description", description)}
        />
        {errors.description && <Text className="text-cyberRose text-xs mt-1">{errors.description}</Text>}
      </View>

      {/* Location Dropdown */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-cyberMuted mb-2">Location (District) *</Text>
        <View className={`border rounded-xl bg-darkCard overflow-hidden ${errors.location ? "border-cyberRose" : "border-darkBorder"}`}>
          <Picker
            selectedValue={location}
            onValueChange={(value) => { setLocation(value); validateField("location", value); }}
            style={{ color: "#F8FAFC", backgroundColor: "#161F30" }}
            dropdownIconColor="#8A99AD"
          >
            <Picker.Item label="Select District" value="" color="#8A99AD" />
            {SRI_LANKA_DISTRICTS.map((district) => (
              <Picker.Item key={district} label={district} value={district} color="#F8FAFC" />
            ))}
          </Picker>
        </View>
        {errors.location && <Text className="text-cyberRose text-xs mt-1">{errors.location}</Text>}
      </View>

      {/* Category Dropdown */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-cyberMuted mb-2">Category *</Text>
        <View className={`border rounded-xl bg-darkCard overflow-hidden ${errors.category ? "border-cyberRose" : "border-darkBorder"}`}>
          <Picker
            selectedValue={category}
            onValueChange={(value) => { setCategory(value); validateField("category", value); }}
            style={{ color: "#F8FAFC", backgroundColor: "#161F30" }}
            dropdownIconColor="#8A99AD"
          >
            <Picker.Item label="Select Category" value="" color="#8A99AD" />
            {CATEGORIES.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} color="#F8FAFC" />
            ))}
          </Picker>
        </View>
        {errors.category && <Text className="text-cyberRose text-xs mt-1">{errors.category}</Text>}
      </View>

      {/* Contact Information */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-cyberText mb-3">Contact Information</Text>

        {/* Phone */}
        <View className="mb-3">
          <Text className="text-sm font-semibold text-cyberMuted mb-2">Phone *</Text>
          <TextInput
            placeholder="07X XXX XXXX"
            placeholderTextColor="#8A99AD"
            keyboardType="phone-pad"
            className={`border p-4 rounded-xl bg-darkCard text-cyberText ${errors.phone ? "border-cyberRose" : "border-darkBorder"}`}
            value={phone}
            onChangeText={(text) => { setPhone(text); validateField("phone", text); }}
            onBlur={() => validateField("phone", phone)}
            maxLength={10}
          />
          {errors.phone && <Text className="text-cyberRose text-xs mt-1">{errors.phone}</Text>}
        </View>

        {/* Email */}
        <View className="mb-3">
          <Text className="text-sm font-semibold text-cyberMuted mb-2">Email *</Text>
          <TextInput
            placeholder="your@email.com"
            placeholderTextColor="#8A99AD"
            keyboardType="email-address"
            autoCapitalize="none"
            className={`border p-4 rounded-xl bg-darkCard text-cyberText ${errors.email ? "border-cyberRose" : "border-darkBorder"}`}
            value={email}
            onChangeText={(text) => { setEmail(text); validateField("email", text); }}
            onBlur={() => validateField("email", email)}
          />
          {errors.email && <Text className="text-cyberRose text-xs mt-1">{errors.email}</Text>}
        </View>
      </View>

      {/* Images Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-cyberText mb-3">Images</Text>
        <Text className="text-sm text-cyberMuted mb-3">Add up to 5 photos ({images.length}/5)</Text>

        {/* Image Preview */}
        {images.length > 0 && (
          <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
            {images.map((img, index) => (
              <View key={index} className="relative mr-3">
                <Image
                  source={{ uri: img }}
                  className="w-24 h-24 rounded-xl border border-darkBorder"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-cyberRose rounded-full p-1"
                >
                  <MaterialIcons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Image Buttons */}
        <View className="flex-row justify-between space-x-3">
          <TouchableOpacity
            className="flex-1 bg-cyberCyan/10 border border-cyberCyan/30 rounded-xl p-4 items-center"
            onPress={pickImage}
            disabled={images.length >= 5}
          >
            <MaterialIcons name="photo-library" size={24} color="#00F0FF" />
            <Text className="text-cyberCyan mt-2 text-center font-medium">Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-cyberViolet/10 border border-cyberViolet/30 rounded-xl p-4 items-center"
            onPress={captureImage}
            disabled={images.length >= 5}
          >
            <MaterialIcons name="camera-alt" size={24} color="#D946EF" />
            <Text className="text-cyberViolet mt-2 text-center font-medium">Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Button */}
      {!isNew && (
        <TouchableOpacity
          className="bg-cyberRose/10 border border-cyberRose/30 rounded-xl p-4 mb-4 flex-row justify-center items-center"
          onPress={handleDelete}
        >
          <MaterialIcons name="delete" size={20} color="#FF007F" />
          <Text className="text-cyberRose text-lg font-semibold ml-2">Delete Item</Text>
        </TouchableOpacity>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        className={`bg-cyberRose rounded-xl p-4 mb-8 flex-row justify-center items-center shadow-[0_0_15px_rgba(255,0,127,0.3)] ${isSubmitting ? "opacity-70" : ""}`}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator color="#0B0F19" className="mr-2" />
            <Text className="text-darkBg text-lg font-bold">
              {isNew ? "Adding..." : "Updating..."}
            </Text>
          </>
        ) : (
          <Text className="text-darkBg text-lg font-bold">
            {isNew ? "Add Lost Item" : "Update Lost Item"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default LostFormScreen;