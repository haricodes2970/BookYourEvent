import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #EAF6F8 0%, #f0f9f0 100%)',
        fontFamily: "'DM Sans', sans-serif",
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ maxWidth: 480 }}
      >
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 'clamp(6rem, 20vw, 10rem)',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #1e4d5c, #2D8A84)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          404
        </motion.div>

        <h1
          style={{
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 800,
            color: '#1e293b',
            marginBottom: 12,
          }}
        >
          Page not found
        </h1>

        <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px',
              borderRadius: 50,
              background: 'linear-gradient(135deg, #1e4d5c, #2D8A84)',
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(30,77,92,0.3)',
            }}
          >
            Go Home
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 28px',
              borderRadius: 50,
              background: 'transparent',
              color: '#1e4d5c',
              fontWeight: 700,
              fontSize: 15,
              border: '1.5px solid #1e4d5c',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
