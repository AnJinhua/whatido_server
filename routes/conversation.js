const express = require("express");
const ConversationController = require('../controllers/conversation')
const router = express.Router()
const conversationRoutes = express.Router()
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", { session: false });
router.use('/conversations', 
// requireAuth, 
conversationRoutes)

  //= ========================
  // Conversation Routes // The new routes
  //= ========================
  //create a conversation
  conversationRoutes.post("/", ConversationController.createConversation);
  //get active conversation using userSlug
  conversationRoutes.get("/:id", ConversationController.getActiveCoversation);
  //get all conversation using userSlug
  conversationRoutes.get(
    "/all/:id",
    ConversationController.getAllConversations
  );
  //delete conversationRoutes
  conversationRoutes.delete("/:id", ConversationController.deleteConversation);
  //get buggy converstaions
  conversationRoutes.get(
    "/all/bugs",
    ConversationController.getBuggyConversations
  );
  //get ongoing conversation using userSlug
  conversationRoutes.get(
    "/ongoing/:id",
    ConversationController.getOngoingCoversation
  );
  conversationRoutes.get(
    "/page/ongoing/:id",
    ConversationController.getPageOngoingCoversation
  );
  //get archive conversation using userSlug
  conversationRoutes.get(
    "/archive/:id",
    ConversationController.getArchivedCoversation
  );
  //add archive conversation using userSlug
  conversationRoutes.put(
    "/archive/:id",
    ConversationController.addArchiveConversation
  );
  //restore archive conversation using userSlug
  conversationRoutes.put(
    "/restore/:id",
    ConversationController.restoreArchiveConversation
  );
  //block conversation
  conversationRoutes.put(
    "/block/:id",
    ConversationController.blockConversation
  );
  //unblock
  conversationRoutes.put(
    "/unblock/:id",
    ConversationController.unBlockConversation
  );
  //temporary delete conversation using userSlug
  conversationRoutes.put(
    "/delete/:id",
    ConversationController.tempDeleteConversation
  );
  // restore temporary delete conversation using userSlug
  conversationRoutes.put(
    "/restoreTempDeleted/:id",
    ConversationController.restoreTempDeletedConversation
  );
  //permanent delete conversation

  conversationRoutes.delete(
    "/permanentDelete/:id",
    ConversationController.permanentDeleteConversation
  );
  //get conversation using conversationId
  conversationRoutes.get(
    "/conversation/:id",
    ConversationController.getConversationById
  );
  //update conversation
  conversationRoutes.put("/:id", ConversationController.updateConversation);
  //find conversation between two users
  conversationRoutes.get(
    "/find/:firstUserId/:secondUserId",
    ConversationController.findUsersConversation
  );
module.exports = router
