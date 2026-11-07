/* ALTER TABLE users
ADD COLUMN wallet_address VARCHAR(44)
CHARACTER SET ascii
COLLATE ascii_bin
NULL,
ADD UNIQUE INDEX uq_users_wallet_address (wallet_address);

DESCRIBE users; */

/*CREATE table wallet_challenges (
	id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nonce VARCHAR(64) NOT NULL UNIQUE,
    message TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wallet_challenges_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
); 
DESCRIBE wallet_challenges; */

/* ALTER TABLE wallet_challenges
ADD COLUMN wallet_address VARCHAR(44) NOT NULL; */

# select * from wallet_challenges;
# DELETE FROM wallet_challenges where id;

select * from users;
# DELETE FROM submissions WHERE game_id;
# select * from submissions;

/*INSERT INTO games (name, slug, parser_key, is_active)
VALUES ('Wordle', 'wordle', 'wordle', TRUE); */

/*INSERT INTO games (name, slug, parser_key, is_active)
VALUES ('Connections', 'connections', 'connections', TRUE);*/
