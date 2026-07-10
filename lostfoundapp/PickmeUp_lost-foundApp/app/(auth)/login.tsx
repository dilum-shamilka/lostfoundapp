import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native"
import React, { useState } from "react"
import { useRouter } from "expo-router"
import { login } from "@/services/authService"
import { Alert } from "@/utils/alert"

const Login = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (isLoading) return
    setIsLoading(true)
    
    await login(email, password)
      .then((res) => {
        console.log(res)
        router.push("/home")
      })
      .catch((err) => {
        console.error(err)
        Alert.alert("Login Failed", "Invalid email or password")
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
          <View className="items-center mb-10">
            <View className="bg-cyberCyan/10 border border-cyberCyan/20 p-5 rounded-2xl mb-4 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <Text className="text-3xl font-bold text-cyberCyan shadow-sm">PickMeUp</Text>
            </View>
            <Text className="text-2xl font-bold text-cyberText">Lost & Found</Text>
            <Text className="text-cyberMuted mt-2 text-center">
              Reconnect with your lost items
            </Text>
          </View>

          {/* Login Form */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-cyberText mb-6 text-center">
              Sign in to your account
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
            
            <View className="mb-1">
              <Text className="text-sm font-medium text-cyberMuted mb-2">Password</Text>
              <View className="flex-row items-center bg-darkCard border border-darkBorder rounded-xl px-5">
                <TextInput
                  placeholder="Enter your password"
                  className="flex-1 py-4 text-cyberText"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Text className="text-cyberCyan font-medium">
                    {isPasswordVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Pressable className="self-end mb-6">
              <Text className="text-cyberCyan text-sm font-medium">Forgot password?</Text>
            </Pressable>
            
            <TouchableOpacity
              className="bg-cyberCyan p-5 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0B0F19" size="large" />
              ) : (
                <Text className="text-center text-darkBg text-lg font-bold">Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View className="flex-row justify-center">
            <Text className="text-cyberMuted">Don't have an account? </Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text className="text-cyberViolet font-semibold">Register</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Login