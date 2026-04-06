import express from 'express';
const router = express.Router();
router.get('/me', (req, res) => {
    res.json({
        success: true,
        message: 'User profile fetched successfully',
    });
});
export const UserRoutes = router;
//# sourceMappingURL=user.route.js.map