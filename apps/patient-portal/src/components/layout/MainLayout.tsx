import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  useTheme,
} from "@mui/material";
import { auraColors, auraTokens } from "@qivr/design-system";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  LocalHospital as HospitalIcon,
  Assessment as AssessmentIcon,
  Message as MessageIcon,
  MedicalServices as MedicalServicesIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { AuraButton } from "@qivr/design-system";

const drawerWidth = 280;

const menuItems = [
  { title: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  {
    title: "Health Progress",
    path: "/health-progress",
    icon: <TrendingUpIcon />,
  },
  { title: "Appointments", path: "/appointments", icon: <EventIcon /> },
  { title: "Messages", path: "/messages", icon: <MessageIcon /> },
  { title: "Assessments", path: "/proms", icon: <AssignmentIcon /> },
  {
    title: "Treatment Plan",
    path: "/treatment-plan",
    icon: <MedicalServicesIcon />,
  },
  { title: "Documents", path: "/documents", icon: <FolderIcon /> },
  { title: "Referrals", path: "/referrals", icon: <SendIcon /> },
  { title: "Evaluations", path: "/evaluations", icon: <AssessmentIcon /> },
  { title: "Profile", path: "/profile", icon: <PersonIcon /> },
];

export const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ px: 2 }}>
        <HospitalIcon sx={{ mr: 2, color: "primary.main" }} />
        <Typography variant="h6" noWrap component="div">
          Patient Portal
        </Typography>
      </Toolbar>
      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 1.5,
            borderRadius: auraTokens.borderRadius.md,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.dark}10 100%)`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Avatar
            sx={{
              mr: 2,
              width: 36,
              height: 36,
              background: `linear-gradient(135deg, ${auraColors.blue.main} 0%, ${auraColors.blue.dark} 100%)`,
            }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" noWrap fontWeight={600}>
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Patient
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: auraTokens.borderRadius.md,
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
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? "white" : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider />

      {/* Logout */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.title ||
              "Patient Portal"}
          </Typography>
          <AuraButton
            size="small"
            color="secondary"
            onClick={() => window.open("https://widget.qivr.health", "_blank")}
          >
            New Evaluation
          </AuraButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: "4px 0 24px rgba(0,0,0,0.04)",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "background.default",
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};
