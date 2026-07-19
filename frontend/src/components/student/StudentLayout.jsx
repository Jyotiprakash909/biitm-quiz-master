import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';

const StudentLayout = ({ children, maxWidth = 'md', disablePadding = false }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      <AppBar position="static" sx={{ backgroundColor: 'white', color: 'primary.main', boxShadow: 1 }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Replace with actual logo if available */}
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', flexGrow: 1, letterSpacing: 1 }}>
              BIITM QUIZ MASTER
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Secure Examination Portal
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container 
        component="main" 
        maxWidth={maxWidth} 
        sx={{ 
          flexGrow: 1, 
          py: disablePadding ? 0 : { xs: 2, md: 4 },
          px: disablePadding ? 0 : { xs: 1, sm: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Container>
      
      <Box component="footer" sx={{ py: 2, textAlign: 'center', backgroundColor: 'white', mt: 'auto', borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} BIITM. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default StudentLayout;
