import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Queue as QueueIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Message as MessageIcon,
  LocalHospital as MedicalIcon,
  MedicalServices as TreatmentIcon,
  Send as ReferralsIcon,
  ViewKanban as KanbanIcon,
} from "@mui/icons-material";
import { useAuthActions, useAuthUser } from "../../stores/authStore";
import { NotificationBell, TenantSelector } from "../shared";
import { ThemeToggle, CountBadge, auraTokens } from "@qivr/design-system";
import type { SxProps, Theme } from "@mui/material/styles";

const drawerWidth = auraTokens.layout.drawerWidth;
const drawerWidthCollapsed = auraTokens.layout.drawerWidthCollapsed;

import { useQuery } from "@tanstack/react-query";
import { messagesApi } from "../../services/messagesApi";

interface MenuItemType {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const getNavButtonStyles = (
  theme: Theme,
  drawerOpen: boolean,
): SxProps<Theme> => ({
  borderRadius: auraTokens.borderRadius.md,
  justifyContent: drawerOpen ? "initial" : "center",
  px: drawerOpen ? auraTokens.spacing.md : auraTokens.spacing.sm,
  my: 0.5,
  transition: auraTokens.transitions.default,
  "&.Mui-selected": {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: "white",
    boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
    "&:hover": {
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      transform: "translateX(4px)",
    },
    "& .MuiListItemIcon-root": {
      color: "white",
    },
  },
  "&:hover:not(.Mui-selected)": {
    backgroundColor: theme.palette.action.hover,
    transform: "translateX(2px)",
  },
});

const getDrawerToolbarStyles = (drawerOpen: boolean): SxProps<Theme> => ({
  display: "flex",
  alignItems: "center",
  justifyContent: drawerOpen ? "space-between" : "center",
  px: drawerOpen ? 3 : 1,
});

const DashboardLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);

  const user = useAuthUser();
  const { logout } = useAuthActions();

  // Fetch unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages"],
    queryFn: messagesApi.unreadCount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const menuItems: MenuItemType[] = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    {
      text: "Intake Management",
      icon: <QueueIcon />,
      path: "/intake",
      badge: 5,
    },
    { text: "Appointments", icon: <CalendarIcon />, path: "/appointments" },
    {
      text: "Medical Records",
      icon: <MedicalIcon />,
      path: "/medical-records",
    },
    {
      text: "Treatment Plans",
      icon: <TreatmentIcon />,
      path: "/treatment-plans",
    },
    { text: "Task Board", icon: <KanbanIcon />, path: "/kanban" },
    { text: "Referrals", icon: <ReferralsIcon />, path: "/referrals" },
    {
      text: "Inbox",
      icon: <MessageIcon />,
      path: "/inbox",
      badge: unreadCount,
    },
    { text: "PROM", icon: <AssignmentIcon />, path: "/prom" },
    { text: "Analytics", icon: <AnalyticsIcon />, path: "/analytics" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={getDrawerToolbarStyles(drawerOpen)}>
        {drawerOpen && (
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ fontWeight: 700 }}
          >
            Qivr Clinic
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon
              sx={{ transform: drawerOpen ? "rotate(0deg)" : "rotate(180deg)" }}
            />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={!drawerOpen ? item.text : ""} placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleMenuClick(item.path)}
                sx={getNavButtonStyles(theme, drawerOpen)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: drawerOpen ? 2 : "auto",
                    justifyContent: "center",
                  }}
                >
                  {item.badge ? (
                    <CountBadge count={item.badge}>{item.icon}</CountBadge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                {drawerOpen && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        {drawerOpen ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 1.5,
              borderRadius: auraTokens.borderRadius.md,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.dark}10 100%)`,
              border: `1px solid ${theme.palette.divider}`,
              transition: auraTokens.transitions.default,
              "&:hover": {
                boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
              },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap fontWeight={600}>
                {user?.name || "User"}
              </Typography>
              <Typography variant="caption" noWrap color="text.secondary">
                {user?.clinicName || "Clinic"}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </Avatar>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: {
            md: `calc(100% - ${drawerOpen ? drawerWidth : drawerWidthCollapsed}px)`,
          },
          ml: { md: `${drawerOpen ? drawerWidth : drawerWidthCollapsed}px` },
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text ||
              "Dashboard"}
          </Typography>

          <Box sx={{ mr: 2 }}>
            <TenantSelector />
          </Box>

          <NotificationBell />

          <ThemeToggle />

          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerOpen ? drawerWidth : drawerWidthCollapsed },
          flexShrink: { md: 0 },
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open={drawerOpen}
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerOpen ? drawerWidth : drawerWidthCollapsed,
                transition: theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: "hidden",
                background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                borderRight: `1px solid ${theme.palette.divider}`,
                boxShadow: "4px 0 24px rgba(0,0,0,0.04)",
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: {
            md: `calc(100% - ${drawerOpen ? drawerWidth : drawerWidthCollapsed}px)`,
          },
          mt: 8,
          backgroundColor: "background.default",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <Outlet />
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            handleProfileMenuClose();
            navigate("/settings");
          }}
        >
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleProfileMenuClose();
            navigate("/settings");
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: auraTokens.responsive.panel,
            maxHeight: auraTokens.responsiveHeights.listArea,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationClose}>
          <Box>
            <Typography variant="body2">
              New patient intake submitted
            </Typography>
            <Typography variant="caption" color="text.secondary">
              John Doe - 5 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationClose}>
          <Box>
            <Typography variant="body2">Appointment reminder sent</Typography>
            <Typography variant="caption" color="text.secondary">
              Sarah Smith - 1 hour ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationClose}>
          <Box>
            <Typography variant="body2">PROM assessment completed</Typography>
            <Typography variant="caption" color="text.secondary">
              Michael Johnson - 2 hours ago
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayout;
