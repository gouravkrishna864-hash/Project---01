// ─── REOS Neo4j Graph Database Setup ─────────────────────────────────────────
// Property Graph for relationship-based recommendations and analytics.

// ─── Constraints (ensure uniqueness + create indexes) ─────────────────────────
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
  FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT property_id_unique IF NOT EXISTS
  FOR (p:Property) REQUIRE p.id IS UNIQUE;

// ─── Indexes for fast lookups ──────────────────────────────────────────────────
CREATE INDEX user_role_idx IF NOT EXISTS FOR (u:User) ON (u.role);
CREATE INDEX user_city_idx IF NOT EXISTS FOR (u:User) ON (u.city);
CREATE INDEX property_city_idx IF NOT EXISTS FOR (p:Property) ON (p.city);
CREATE INDEX property_type_idx IF NOT EXISTS FOR (p:Property) ON (p.type);
CREATE INDEX property_price_idx IF NOT EXISTS FOR (p:Property) ON (p.price);

// ─── Relationship Types ────────────────────────────────────────────────────────
// (User)-[:VIEWED     {count, last_viewed}]->(Property)
// (User)-[:SHORTLISTED                     ]->(Property)
// (User)-[:INTERESTED {score, created_at}  ]->(Property)
// (User)-[:LISTED     {created_at}         ]->(Property)
// (User)-[:BOUGHT     {price, date}        ]->(Property)
// (User)-[:REFERRED   {created_at}         ]->(User)

// ─── Sample seed data (for development) ───────────────────────────────────────
// Run this only in development to create test graph structure.

// MERGE (u1:User {id: 'seed-user-1', name: 'Test Buyer', role: 'buyer', city: 'Pune'})
// MERGE (u2:User {id: 'seed-broker-1', name: 'Test Broker', role: 'broker', city: 'Pune'})
// MERGE (p1:Property {id: 'seed-prop-1', title: 'Test Apartment', city: 'Pune', type: 'apartment', price: 5000000})
// MERGE (p2:Property {id: 'seed-prop-2', title: 'Test Villa', city: 'Pune', type: 'villa', price: 12000000})
// MERGE (u2)-[:LISTED {created_at: datetime()}]->(p1)
// MERGE (u2)-[:LISTED {created_at: datetime()}]->(p2)
// MERGE (u1)-[:VIEWED {count: 3, last_viewed: datetime()}]->(p1)
// MERGE (u1)-[:INTERESTED {score: 78.5, created_at: datetime()}]->(p1)

// ─── Useful Cypher Queries ─────────────────────────────────────────────────────

// 1. Find properties similar to a given property (co-viewed by same users)
// MATCH (p:Property {id: $propertyId})<-[:VIEWED]-(u:User)-[:VIEWED]->(similar:Property)
// WHERE similar.id <> $propertyId
// RETURN similar, COUNT(u) AS shared_viewers
// ORDER BY shared_viewers DESC LIMIT 5

// 2. Recommend properties for a user based on what similar users liked
// MATCH (target:User {id: $userId})-[:VIEWED]->(p:Property)<-[:VIEWED]-(similar:User)
// WHERE similar.id <> $userId
// WITH similar, COUNT(p) AS shared_views ORDER BY shared_views DESC LIMIT 10
// MATCH (similar)-[:INTERESTED]->(recommended:Property)
// WHERE NOT (target)-[:VIEWED]->(recommended)
// RETURN recommended, COUNT(similar) AS recommenders
// ORDER BY recommenders DESC LIMIT 10

// 3. Find top brokers in a city by deal volume
// MATCH (b:User {role: 'broker', city: $city})-[:LISTED]->(p:Property)
// OPTIONAL MATCH (p)<-[:BOUGHT]-()
// RETURN b.id, b.name, COUNT(DISTINCT p) AS listings, COUNT(DISTINCT ()-[:BOUGHT]->(p)) AS deals
// ORDER BY deals DESC LIMIT 10

// 4. Get trending properties this week
// MATCH (u:User)-[v:VIEWED]->(p:Property {city: $city})
// WHERE v.last_viewed > datetime() - duration('P7D')
// WITH p, COUNT(v) AS weekly_views ORDER BY weekly_views DESC LIMIT 10
// RETURN p.id, p.title, weekly_views

// 5. Detect broker network (referral tracking)
// MATCH path = (b:User {role: 'broker'})-[:REFERRED*1..3]->(new_broker:User)
// RETURN path, length(path) AS depth ORDER BY depth
