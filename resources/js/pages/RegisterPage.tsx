import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { useAuth } from '../auth'
import { register } from '../services/auth'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const { setUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== passwordConfirmation) return setError(t('passwordMismatch'))
    setError('')
    setLoading(true)
    try {
      setUser(await register({ name, email, password, passwordConfirmation }))
      navigate('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : t('registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} className="auth-page">
      <Text className="brand">{t('appName')}</Text>
      <Title order={1}>{t('createAccount')}</Title>
      <Text c="dimmed" mt={6}>
        {t('hasAccount')} <Anchor onClick={() => navigate('/login')}>{t('login')}</Anchor>
      </Text>
      <Paper withBorder p="xl" mt="xl" radius="sm">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label={t('name')}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              required
              maxLength={32}
            />
            <TextInput
              label={t('email')}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
            />
            <PasswordInput
              label={t('password')}
              description={t('passwordHint')}
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              minLength={8}
              maxLength={32}
            />
            <PasswordInput
              label={t('confirmPassword')}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.currentTarget.value)}
              required
            />
            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}
            <Button type="submit" color="orange" loading={loading}>
              {t('register')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
