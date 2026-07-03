import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  Field,
  Notice,
  PlainScreen,
  palette,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';

export function LoginForm() {
  const auth = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);

  const submit = async () => {
    if (!login.trim() || !password) return;
    const ok = resetMode
      ? await auth.resetPassword(login.trim(), password)
      : await auth.login(login.trim(), password);

    if (ok) {
      if (resetMode) {
        setResetMode(false);
        setPassword('');
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <AuthScaffold
      title={resetMode ? 'Reset Password' : 'Welcome Back'}
      subtitle={
        resetMode
          ? 'Set a new local password for your Kino account.'
          : 'Sign in to sync your vault, friends, profile, and chats.'
      }
    >
      {auth.error ? <Notice type="error" message={auth.error} /> : null}
      <Field
        label="Email or username"
        icon="user"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
      />
      <Field
        label={resetMode ? 'New password' : 'Password'}
        icon="lock"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
      />
      <Button
        label={resetMode ? 'Reset Password' : 'Sign In'}
        icon={resetMode ? 'refresh-cw' : 'log-in'}
        onPress={submit}
        loading={auth.isLoading}
        disabled={!login.trim() || !password}
      />
      <Button
        label={resetMode ? 'Back to Sign In' : 'Forgot Password'}
        variant="ghost"
        icon={resetMode ? 'arrow-left' : 'help-circle'}
        onPress={() => {
          auth.clearError();
          setResetMode((value) => !value);
        }}
      />
      {!resetMode ? (
        <Text style={styles.switchText}>
          New to Kino?{' '}
          <Link href="/(auth)/register" style={styles.link}>
            Create an account
          </Link>
        </Text>
      ) : null}
    </AuthScaffold>
  );
}

export function RegisterForm() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (!email.trim() || !username.trim() || !password) return;
    const ok = await auth.register(email.trim(), username.trim(), password);
    if (ok) router.replace('/(tabs)');
  };

  return (
    <AuthScaffold
      title="Create Your Vault"
      subtitle="Track films, shows, anime, music, friends, and recommendations in one private place."
    >
      {auth.error ? <Notice type="error" message={auth.error} /> : null}
      <Field
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Username"
        icon="at-sign"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
      />
      <Field
        label="Password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
      />
      <Button
        label="Create Account"
        icon="user-plus"
        onPress={submit}
        loading={auth.isLoading}
        disabled={!email.trim() || !username.trim() || !password}
      />
      <Text style={styles.switchText}>
        Already have an account?{' '}
        <Link href="/(auth)/login" style={styles.link}>
          Sign in
        </Link>
      </Text>
    </AuthScaffold>
  );
}

function AuthScaffold({
  title,
  subtitle,
  children,
}: React.PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <PlainScreen contentStyle={styles.screen}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Text style={styles.markText}>K</Text>
        </View>
        <Text style={styles.brandText}>Kino</Text>
      </View>
      <Card style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.form}>{children}</View>
      </Card>
    </PlainScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
    gap: 18,
  },
  brand: {
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 58,
    height: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  markText: {
    color: palette.primaryForeground,
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  brandText: {
    color: palette.foreground,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  card: {
    gap: 14,
  },
  title: {
    color: palette.foreground,
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    color: palette.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  form: {
    gap: 14,
    marginTop: 4,
  },
  switchText: {
    color: palette.mutedForeground,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  link: {
    color: palette.primary,
    fontFamily: 'Inter_700Bold',
  },
});
