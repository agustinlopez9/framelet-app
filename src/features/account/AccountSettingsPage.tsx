import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMyUser } from '@/queries';
import { UsernameEditor } from './components/UsernameEditor';
import { PasswordEditor } from './components/PasswordEditor';

export function AccountSettingsPage() {
  const { data: user, isLoading } = useMyUser();

  if (isLoading || !user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold">Account settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your username is used in all your portfolio URLs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <UsernameEditor username={user.username ?? ''} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordEditor />
        </CardContent>
      </Card>
    </div>
  );
}
