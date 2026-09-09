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
import { login } from '../services/auth'

export default function LoginPage() {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      setUser(await login({ email, password }))
      navigate('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} className="auth-page">
      <Text className="brand">{t('appName')}</Text>
      <Title order={1}>{t('welcomeBack')}</Title>
      <Text c="dimmed" mt={6}>
        {t('noAccount')} <Anchor onClick={() => navigate('/register')}>{t('register')}</Anchor>
      </Text>
      <Paper withBorder p="xl" mt="xl" radius="sm">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label={t('email')}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
            />
            <PasswordInput
              label={t('password')}
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
            />
            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}
            <Button type="submit" color="orange" loading={loading}>
              {t('login')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
