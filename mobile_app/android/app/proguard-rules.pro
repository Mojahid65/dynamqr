# Flutter / Dart core
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# Generic Java reflection used by JSON / serialization libraries
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# Kotlin
-dontwarn kotlin.**
-keep class kotlin.Metadata { *; }

# Firebase Core / Cloud Messaging
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Play Services (used by google_sign_in & Firebase)
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# google_sign_in
-keep class io.flutter.plugins.googlesignin.** { *; }

# OkHttp / Okio (transitive deps used by supabase/firebase/etc.)
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# Mobile Scanner (zxing/mlkit native bindings)
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.vision.** { *; }
-dontwarn com.google.mlkit.**

# permission_handler
-keep class com.baseflow.permissionhandler.** { *; }

# Flutter local notifications
-keep class com.dexterous.** { *; }
-dontwarn com.dexterous.**

# AndroidX SplashScreen API used by flutter_native_splash on Android 12+
-keep class androidx.core.splashscreen.** { *; }

# Keep Parcelable & Serializable plumbing
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
