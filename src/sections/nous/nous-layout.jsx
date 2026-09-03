import { useNavigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { useNousData } from 'src/context/nous-data';

import { signOut } from 'src/auth/context/jwt';
import { useAuthContext } from 'src/auth/hooks';

import {
  Logo,
  Avatar,
  AppMain,
  AppRoot,
  AppHeader,
  AppFooter,
  HeaderNote,
  HeaderText,
  HeaderLink,
  HeaderButton,
  HeaderActions,
} from './styles';

// ----------------------------------------------------------------------

export function NousLayout({ children }) {
  const { settings } = useNousData();

  const { user, isAdmin, checkUserSession } = useAuthContext();

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    await checkUserSession();
    navigate(paths.auth.jwt.signIn, { replace: true });
  };

  return (
    <AppRoot>
      <AppHeader>
        <Logo href={paths.nous.root}>
          {settings?.logoPrefix ?? 'NO'}
          <span>{settings?.logoSuffix ?? 'US'}</span>
        </Logo>

        <HeaderActions>
          <HeaderNote>{settings?.headerNote ?? 'CA & ACCA'}</HeaderNote>

          {isAdmin && <HeaderLink href={paths.admin.root}>Admin panel</HeaderLink>}

          <Avatar>{user?.name?.charAt(0).toUpperCase()}</Avatar>

          <HeaderText>{user?.name}</HeaderText>

          <HeaderButton type="button" onClick={handleSignOut}>
            Sign out
          </HeaderButton>
        </HeaderActions>
      </AppHeader>

      <AppMain>{children}</AppMain>

      <AppFooter>{settings?.footerText ?? 'NOUS © 2026'}</AppFooter>
    </AppRoot>
  );
}
