#!/usr/bin/perl

for (glob('*.png')){
	my $new = $_;
	$new =~ s/.*(\d{2})(\d{2})\d{2}.*/2017-$1-$2-0000.png/;
	print "$new\n";
	rename $_,$new;
}
