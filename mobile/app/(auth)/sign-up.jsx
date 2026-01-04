import { useState, useRef, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, View, Animated } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { styles } from "@/assets/styles/auth.style.js";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const codeBoxAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (error) {
      // Shake animation on error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  useEffect(() => {
    if (pendingVerification) {
      // Code box entrance animation
      Animated.spring(codeBoxAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [pendingVerification]);

  useEffect(() => {
    if (isLoading) {
      // Spinning animation for loading
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        setError("That email address is already in use. Please try another.");
      } else if (err.errors?.[0]?.code === "form_password_pwned") {
        setError("This password is too common. Please use a stronger password.");
      } else if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError("An error occurred. Please try again.");
      }
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      setError("Invalid verification code. Please try again.");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setError("");
      // Could add a success toast here
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    }
  };

  if (pendingVerification) {
    return (
      <LinearGradient
        colors={[COLORS.background, "#FFF8F3", COLORS.background]}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            styles.verificationContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: codeBoxAnim }],
            },
          ]}
        >
          {/* Email sent illustration */}
          <Animated.View
            style={{
              transform: [
                {
                  scale: codeBoxAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={60} color={COLORS.primary} />
            </View>
          </Animated.View>

          <Text style={styles.verificationTitle}>Verify your email</Text>
          <Text style={styles.verificationSubtitle}>
            We've sent a 6-digit code to{"\n"}
            <Text style={{ fontWeight: "600", color: COLORS.primary }}>
              {emailAddress}
            </Text>
          </Text>

          {error ? (
            <Animated.View
              style={[
                styles.errorBox,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError("")}>
                <Ionicons name="close" size={20} color={COLORS.expense} />
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          <TextInput
            style={[styles.verificationInput, error && styles.errorInput]}
            value={code}
            placeholder="000000"
            placeholderTextColor="#D4C4B8"
            onChangeText={(code) => setCode(code)}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            onPress={onVerifyPress}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, "#D97757"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync" size={24} color={COLORS.white} />
                </Animated.View>
              ) : (
                <Text style={styles.buttonText}>Verify Email</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={resendCode}
          >
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
            <Text style={styles.resendText}>Didn't receive code? Resend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setPendingVerification(false)}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.textLight} />
            <Text style={styles.backText}>Back to sign up</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.background, "#FFF8F3", COLORS.background]}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0.9, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }}
          >
            <Image
              source={require("../../assets/images/revenue-i2.png")}
              style={styles.illustration}
            />
          </Animated.View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and start managing your finances</Text>

          {error ? (
            <Animated.View
              style={[
                styles.errorBox,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError("")}>
                <Ionicons name="close" size={20} color={COLORS.expense} />
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.inputWithIcon, error && styles.errorInput]}
              autoCapitalize="none"
              value={emailAddress}
              placeholderTextColor="#9A8478"
              placeholder="Enter email"
              onChangeText={(email) => setEmailAddress(email)}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.inputWithIcon, error && styles.errorInput]}
              value={password}
              placeholder="Enter password (min 8 characters)"
              placeholderTextColor="#9A8478"
              secureTextEntry={!showPassword}
              onChangeText={(password) => setPassword(password)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onSignUpPress}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, "#D97757"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync" size={24} color={COLORS.white} />
                </Animated.View>
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}