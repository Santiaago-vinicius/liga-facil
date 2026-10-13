-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('FUTSAL', 'FUT7', 'FUT11', 'AREIA');

-- CreateEnum
CREATE TYPE "Format" AS ENUM ('PONTOS_CORRIDOS', 'MATA_MATA', 'GRUPOS_MATA_MATA');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('AGENDADO', 'EM_ANDAMENTO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('LIGA', 'GRUPOS', 'OITAVAS', 'QUARTAS', 'SEMI', 'FINAL', 'OUTRA');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('GOL', 'ASSISTENCIA', 'AMARELO', 'VERMELHO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isPlayer" BOOLEAN NOT NULL DEFAULT false,
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modality" "Modality" NOT NULL,
    "format" "Format" NOT NULL,
    "slots" INTEGER NOT NULL,
    "homeAndAway" BOOLEAN NOT NULL DEFAULT false,
    "groupsCount" INTEGER,
    "qualifiersPerGroup" INTEGER,
    "tiebreakers" TEXT[],
    "yellowLimit" INTEGER NOT NULL DEFAULT 3,
    "redSuspension" INTEGER NOT NULL DEFAULT 1,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDENTE',
    "groupName" TEXT,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "round" INTEGER NOT NULL,
    "groupName" TEXT,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "penaltyWinnerId" TEXT,
    "date" TIMESTAMP(3),
    "location" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'AGENDADO',

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lineup" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamPlayerId" TEXT NOT NULL,
    "position" TEXT NOT NULL,

    CONSTRAINT "Lineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamPlayerId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suspension" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamPlayerId" TEXT NOT NULL,
    "gamesRemaining" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_tournamentId_teamId_key" ON "Enrollment"("tournamentId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Lineup_matchId_teamPlayerId_key" ON "Lineup"("matchId", "teamPlayerId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lineup" ADD CONSTRAINT "Lineup_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lineup" ADD CONSTRAINT "Lineup_teamPlayerId_fkey" FOREIGN KEY ("teamPlayerId") REFERENCES "TeamPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_teamPlayerId_fkey" FOREIGN KEY ("teamPlayerId") REFERENCES "TeamPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suspension" ADD CONSTRAINT "Suspension_teamPlayerId_fkey" FOREIGN KEY ("teamPlayerId") REFERENCES "TeamPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
