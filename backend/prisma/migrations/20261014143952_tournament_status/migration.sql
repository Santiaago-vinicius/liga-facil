-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('INSCRICOES', 'EM_ANDAMENTO', 'FINALIZADO');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "status" "TournamentStatus" NOT NULL DEFAULT 'INSCRICOES';
