import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native"
import React, { useState } from "react"
import { useRouter } from "expo-router"
import { register } from "@/services/authService"
import { Alert } from "@/utils/alert"

const Register = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState<boolean>(false)

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (isLoading) return
    setIsLoading(true)
    
    await register(email, password)
      .then((res) => {
        console.log(res)
        Alert.alert("Success", "Account created successfully!")
        router.back()
      })
      .catch((err) => {
        console.error(err)
        Alert.alert("Registration Failed", "Something went wrong")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-darkBg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8">
          {/* Logo and Header */}
          <View className="items-center mb-8">
            <View className="bg-cyberCyan/10 border border-cyberCyan/20 p-5 rounded-2xl mb-4 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <Text className="text-3xl font-bold text-cyberCyan">PickMeUp</Text>
            </View>
            <Text className="text-2xl font-bold text-cyberText">Create Account</Text>
            <Text className="text-cyberMuted mt-2 text-center">
              Join our community to find lost items
            </Text>
          </View>

          {/* Registration Form */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-cyberText mb-6 text-center">
              Sign up to get started
            </Text>
            
            <View className="mb-5">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Email Address</Text>
              <TextInput
                placeholder="Enter your email"
                className="bg-darkCard border border-darkBorder rounded-xl px-5 py-4 text-cyberText"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            
            <View className="mb-5">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Password</Text>
              <View className="flex-row items-center bg-darkCard border border-darkBorder rounded-xl px-5">
                <TextInput
                  placeholder="Create a password"
                  className="flex-1 py-4 text-cyberText"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password-new"
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Text className="text-cyberCyan font-medium">
                    {isPasswordVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Confirm Password</Text>
              <View className="flex-row items-center bg-darkCard border border-darkBorder rounded-xl px-5">
                <TextInput
                  placeholder="Confirm your password"
                  className="flex-1 py-4 text-cyberText"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!isConfirmPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoComplete="password-new"
                />
                <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                  <Text className="text-cyberCyan font-medium">
                    {isConfirmPasswordVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              className="bg-cyberGreen p-5 rounded-xl shadow-[0_0_15px_rgba(0,230,118,0.3)]"
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0B0F19" size="large" />
              ) : (
                <Text className="text-center text-darkBg text-lg font-bold">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text className="text-xs text-cyberMuted text-center mb-8 px-4">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>

          {/* Login link */}
          <View className="flex-row justify-center">
            <Text className="text-cyberMuted">Already have an account? </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-cyberCyan font-semibold">Login</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Register