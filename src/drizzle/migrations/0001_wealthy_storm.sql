CREATE TABLE "allotments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "allotments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"studentId" integer NOT NULL,
	"classId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_sectionId_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_student_allotment" ON "allotments" USING btree ("studentId","classId","sectionId");