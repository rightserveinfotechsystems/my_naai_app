# =============================================================================
# My Naai — release (R8 / ProGuard) rules
# =============================================================================
# Applied to release builds via build.gradle (minifyEnabled true).
#
# NOTE: React Native core (react-android AAR) already ships its own consumer
# rules that keep the bridge, all NativeModule/JavaScriptModule implementors,
# @DoNotStrip members, JNI native methods, Hermes, Yoga and Fresco — so the
# rules below only complement them for this app's own dependencies.

# --- Crash-report friendly obfuscation -----------------------------------
# Classes get renamed, but source file names + line numbers are preserved so
# Play Console / crash stacks stay de-obfuscatable via the mapping file.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Metadata that reflection/serialization-heavy libraries rely on.
-keepattributes Signature, *Annotation*, InnerClasses, EnclosingMethod, Exceptions

# --- Stronger obfuscation & shrinking (Play Console "Code optimization") ----
# Move every obfuscated class into the root package and let R8 widen/narrow
# access modifiers. Everything guarded by a -keep rule keeps its identity;
# everything else gets renamed, which lifts the Obfuscation percentage.
-repackageclasses ''
-allowaccessmodification

# --- Firebase (@react-native-firebase/*) ------------------------------------
# Modern Firebase AARs ship consumer rules, but RN Firebase modules are also
# looked up reflectively — keep them explicitly (official RNFB guidance).
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**
-keep class com.google.firebase.messaging.** { *; }
-dontwarn com.google.firebase.**

# --- Notifee (@notifee/react-native) -----------------------------------------
# Components declared in its manifest are kept automatically by AGP; suppress
# warnings about optional deps only.
-dontwarn app.notifee.**

# --- Razorpay (react-native-razorpay / checkout SDK) -------------------------
# The Checkout SDK loads payment internals reflectively.
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**

# --- react-native-image-crop-picker (UCrop) -----------------------------------
-keep class com.yalantis.ucrop.** { *; }
-keep interface com.yalantis.ucrop.** { *; }
-dontwarn com.yalantis.ucrop.**

# --- react-native-permissions ---------------------------------------------------
# Permission handlers are instantiated reflectively by the module.
-keep class com.zoontek.rnpermissions.** { *; }
-dontwarn com.zoontek.rnpermissions.**

# --- react-native-bootsplash ---------------------------------------------------
-keep class com.zoontek.rnbootsplash.** { *; }
-dontwarn com.zoontek.rnbootsplash.**

# --- Common multi-release/optional-dependency noise (R8 full mode) ------------
-dontwarn java.lang.invoke.StringConcatFactory
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
