-- CreateTable
CREATE TABLE "ToolExecution" (
    "id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "params" JSONB,
    "result" JSONB,
    "logs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "success" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolExecution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ToolExecution" ADD CONSTRAINT "ToolExecution_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
