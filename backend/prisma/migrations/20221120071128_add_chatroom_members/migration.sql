-- CreateTable
CREATE TABLE "ChatroomMembers" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatroomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ChatroomMembers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatroomMembers" ADD CONSTRAINT "ChatroomMembers_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "Chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatroomMembers" ADD CONSTRAINT "ChatroomMembers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
